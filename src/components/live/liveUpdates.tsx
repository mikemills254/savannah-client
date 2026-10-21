import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LuCalendarCheck, LuCalendarClock, LuCalendarX } from 'react-icons/lu'
import { API_BASE_URL } from '../../lib/api.ts'
import { openEventStream } from '../../lib/eventStream.ts'
import { useDoctorStore } from '../../pages/doctor/store/useDoctorStore.ts'
import { useFacilityStore } from '../../pages/facility/store/useFacilityStore.ts'
import { dayHeading, formatTime } from '../../pages/facility/utils/clinicTime.ts'
import { usePatientStore } from '../../pages/patient/store/usePatientStore.ts'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { useLiveStore } from '../../store/useLiveStore.ts'
import type { IAuthUser } from '../../types/auth.types.ts'
import type { IAppointmentEvent } from '../../types/events.types.ts'
import type { IAppointment } from '../../types/facility.types.ts'
import { UserRole } from '../../types/types.ts'

// Super admins don't see bookings, so they have no stream
const LIVE_ROLES: UserRole[] = [UserRole.PATIENT, UserRole.DOCTOR, UserRole.FACILITY_ADMIN]

// Puts a change into the store the user's pages read, if it's loaded for them;
// a store that isn't will load the change with everything else
function apply(userId: string, role: UserRole, appointment: IAppointment) {
    if (role === UserRole.DOCTOR && useDoctorStore.getState().loadedFor === userId) {
        useDoctorStore.getState().applyAppointment(appointment)
    } else if (role === UserRole.FACILITY_ADMIN && useFacilityStore.getState().loadedFor === userId) {
        useFacilityStore.getState().applyAppointment(appointment)
    } else if (role === UserRole.PATIENT && usePatientStore.getState().loadedFor === userId) {
        usePatientStore.getState().applyAppointment(appointment)
    }
}

// Re-reads everything, for when changes may have been missed while disconnected
function resync(role: UserRole) {
    const failed = () => toast.error("Couldn't refresh your appointments. Reload the page to be sure they're current.")
    if (role === UserRole.DOCTOR) useDoctorStore.getState().refreshAppointments().catch(failed)
    else if (role === UserRole.FACILITY_ADMIN) useFacilityStore.getState().refreshAppointments().catch(failed)
    else if (role === UserRole.PATIENT) usePatientStore.getState().refresh().catch(failed)
}

const ICONS = {
    'appointment.booked': LuCalendarCheck,
    'appointment.cancelled': LuCalendarX,
    'appointment.rescheduled': LuCalendarClock,
}

// What happened, worded for whoever is watching
function describe(role: UserRole, { type, appointment: a }: IAppointmentEvent): { title: string; detail: string } {
    const tz = a.facility.timezone
    const when = `${dayHeading(a.starts_at, new Date(), tz)}, ${formatTime(a.starts_at, tz)}`

    if (role === UserRole.PATIENT) {
        if (type === 'appointment.booked') {
            return { title: `Booked with ${a.doctor.name}`, detail: `${when} · by ${a.booked_by?.name ?? a.facility.name}` }
        }
        if (type === 'appointment.cancelled') {
            const reason = a.cancellation_reason ? ` · “${a.cancellation_reason}”` : ''
            return { title: 'Your visit was cancelled', detail: `${a.doctor.name}, ${when}${reason}` }
        }
        return { title: 'Your visit was moved', detail: `Now ${when} with ${a.doctor.name}` }
    }

    // Admins follow every doctor, so say which one
    const who = role === UserRole.FACILITY_ADMIN ? `${a.patient.name} with ${a.doctor.name}` : a.patient.name
    if (type === 'appointment.booked') return { title: 'New booking', detail: `${who} · ${when}` }
    if (type === 'appointment.cancelled') return { title: 'Visit cancelled', detail: `${who} · ${when}` }
    return { title: 'Visit moved', detail: `${who} · now ${when}` }
}

function announce(role: UserRole, event: IAppointmentEvent) {
    const { title, detail } = describe(role, event)
    const Icon = ICONS[event.type]
    toast(
        <span className="flex flex-col">
            <strong className="font-semibold">{title}</strong>
            <span className="text-white/75">{detail}</span>
            {role === UserRole.PATIENT && (
                <Link to={`/visits/${event.appointment.id}`} className="mt-0.5 font-semibold text-secondary hover:underline">
                    View visit
                </Link>
            )}
        </span>,
        {
            // The same change can't be announced twice, e.g. after a reconnect
            id: `${event.appointment.id}:${event.type}:${event.appointment.starts_at}`,
            icon: <Icon className="size-5 shrink-0 text-secondary" />,
            duration: 7000,
            style: { borderRadius: '1rem' },
        },
    )
}

// Keeps the signed-in user's pages current: opens the event stream, puts each
// change into their role's store, and announces changes other people made.
// Renders nothing.
export default function LiveUpdates({ user }: { user: IAuthUser }) {
    // Not the user object: a re-read profile is a new object, and mustn't reconnect
    const { id: userId, role } = user

    useEffect(() => {
        if (!LIVE_ROLES.includes(role)) return
        const { setStatus, markFresh } = useLiveStore.getState()
        const title = document.title
        let connectedBefore = false
        // Changes announced while the tab was in the background, shown in its title
        let unseen = 0

        const onVisible = () => {
            if (document.visibilityState !== 'visible' || unseen === 0) return
            unseen = 0
            document.title = title
        }
        document.addEventListener('visibilitychange', onVisible)

        const stop = openEventStream({
            url: `${API_BASE_URL}/events`,
            token: () => useAuthStore.getState().token,
            onStatus: setStatus,
            onUnauthorized: (rejected) => {
                // As the API client does: only sign out if it's still this session's token
                const { token, logout } = useAuthStore.getState()
                if (token === rejected) logout()
            },
            onEvent: ({ event, data }) => {
                if (event === 'ready') {
                    if (connectedBefore) resync(role)
                    connectedBefore = true
                    return
                }
                if (event !== 'appointment') return

                let change: IAppointmentEvent
                try {
                    change = JSON.parse(data)
                } catch {
                    return
                }
                apply(userId, role, change.appointment)
                // Their own change, from this tab or another: it's already on screen
                if (change.actor_id === userId) return

                markFresh(change.appointment.id, change.type)
                announce(role, change)
                if (document.visibilityState === 'hidden') {
                    unseen += 1
                    document.title = `(${unseen}) ${title}`
                }
            },
        })

        return () => {
            stop()
            setStatus('off')
            document.removeEventListener('visibilitychange', onVisible)
            document.title = title
        }
    }, [userId, role])

    return null
}

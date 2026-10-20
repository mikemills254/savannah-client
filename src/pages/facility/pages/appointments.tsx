import { useState } from 'react'
import { LuCalendarPlus } from 'react-icons/lu'
import type { IAppointment } from '../../../types/facility.types.ts'
import { useAuthStore } from '../../../store/useAuthStore.ts'
import { UserRole } from '../../../types/types.ts'
import Wrapper from '../components/layout/wrapper.tsx'
import AppointmentRow from '../components/appointments/appointmentRow.tsx'
import BookForPatient from '../components/appointments/bookForPatient.tsx'
import Panel from '../components/ui/panel.tsx'
import SegmentedControl from '../components/ui/segmentedControl.tsx'
import { useClinicNow } from '../hooks/useClinicNow.ts'
import { useFacilityStore } from '../store/useFacilityStore.ts'
import { clinicClock, dayHeading } from '../utils/clinicTime.ts'

type View = 'upcoming' | 'past' | 'cancelled'

// A visit in progress still counts as upcoming: it isn't over yet
function viewOf(appointment: IAppointment, now: Date): View {
    if (appointment.status === 'CANCELLED') return 'cancelled'
    return new Date(appointment.ends_at) > now ? 'upcoming' : 'past'
}

interface DayGroup {
    day: string
    heading: string
    appointments: IAppointment[]
}

export default function Appointments() {
    const isAdmin = useAuthStore((s) => s.user?.role === UserRole.FACILITY_ADMIN)
    const members = useFacilityStore((s) => s.members)
    const appointments = useFacilityStore((s) => s.appointments)
    const { now, timeZone } = useClinicNow()

    const [view, setView] = useState<View>('upcoming')
    const [doctorId, setDoctorId] = useState('all')
    const [query, setQuery] = useState('')
    const [booking, setBooking] = useState(false)

    const doctors = members
        .filter((member) => member.role === UserRole.DOCTOR)
        .sort((a, b) => a.name.localeCompare(b.name))
    const doctorNames = new Map(doctors.map((doctor) => [doctor.id, doctor.name]))

    const counts: Record<View, number> = { upcoming: 0, past: 0, cancelled: 0 }
    for (const appointment of appointments) counts[viewOf(appointment, now)] += 1

    const search = query.trim().toLowerCase()
    // Upcoming reads forwards from now; past and cancelled read back from the latest
    const direction = view === 'upcoming' ? 1 : -1
    const shown = appointments
        .filter((a) => viewOf(a, now) === view)
        .filter((a) => doctorId === 'all' || a.doctor.id === doctorId)
        .filter((a) => !search || a.patient.name.toLowerCase().includes(search))
        .sort((a, b) => direction * (new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()))

    const groups: DayGroup[] = []
    for (const appointment of shown) {
        const day = clinicClock(appointment.starts_at, timeZone).day
        const last = groups[groups.length - 1]
        if (last?.day === day) {
            last.appointments.push(appointment)
        } else {
            groups.push({ day, heading: dayHeading(appointment.starts_at, now, timeZone), appointments: [appointment] })
        }
    }

    return (
        <Wrapper title={isAdmin ? 'Appointments' : 'My appointments'}>
            <div className="flex flex-col gap-6">
                {isAdmin && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="m-0 max-w-xl text-sm text-copy-light">
                            Patients book online themselves. Booking for someone on the phone or at the desk? Do it
                            here, even if they've never used DocConnect.
                        </p>
                        {!booking && (
                            <button type="button" onClick={() => setBooking(true)} className="btn btn-primary shrink-0">
                                <LuCalendarPlus className="size-4" />
                                Book for a patient
                            </button>
                        )}
                    </div>
                )}

                {booking && (
                    <Panel title="Book for a patient">
                        <BookForPatient doctors={doctors} onClose={() => setBooking(false)} />
                    </Panel>
                )}

                <Panel>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <SegmentedControl
                            label="Show appointments"
                            value={view}
                            onChange={setView}
                            options={[
                                { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
                                { value: 'past', label: 'Past', count: counts.past },
                                { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
                            ]}
                        />

                        <div className="flex flex-col gap-3 sm:flex-row">
                            {doctors.length > 1 && (
                                <select
                                    value={doctorId}
                                    onChange={(event) => setDoctorId(event.target.value)}
                                    aria-label="Filter by doctor"
                                    className="form-input select-chevron sm:w-52"
                                >
                                    <option value="all">All doctors</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search patient"
                                aria-label="Search by patient"
                                className="form-input sm:w-52"
                            />
                        </div>
                    </div>

                    {groups.length === 0 ? (
                        <p className="m-0 py-12 text-center text-sm text-copy-light">
                            No {view === 'upcoming' ? 'upcoming' : view} appointments
                            {doctorId !== 'all' && ` with ${doctorNames.get(doctorId)}`}
                            {search && ` for “${query.trim()}”`}.
                        </p>
                    ) : (
                        groups.map((group) => (
                            <div key={group.day} className="mt-6">
                                <h3 className="mb-1 px-2 text-xs font-semibold tracking-wide text-copy-lighter uppercase">
                                    {group.heading}
                                    <span className="font-medium normal-case"> · {group.appointments.length}</span>
                                </h3>
                                <ul className="m-0 flex list-none flex-col p-0">
                                    {group.appointments.map((appointment) => (
                                        <AppointmentRow
                                            key={appointment.id}
                                            appointment={appointment}
                                            now={now}
                                            timeZone={timeZone}
                                            showDoctor={isAdmin}
                                        />
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </Panel>
            </div>
        </Wrapper>
    )
}

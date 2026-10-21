import { create } from 'zustand'
import { handleCancelAppointment, handleRescheduleAppointment } from '../../../api/booking.ts'
import { handleGetFacilityAppointments, handleGetWorkingHours, handleSetWorkingHours } from '../../../api/facility.ts'
import { unwrap } from '../../../api/request.ts'
import type { IAuthUser, IFacility } from '../../../types/auth.types.ts'
import type { IAppointment, IWorkingHour, IWorkingHourInput } from '../../../types/facility.types.ts'
import { clinicClock, DAY_MS } from '../../facility/utils/clinicTime.ts'

// How far ahead the doctor's visits are loaded
const DAYS_AHEAD = 30

type Status = 'idle' | 'loading' | 'ready' | 'error'

// The signed-in doctor's own hours and visits, at every facility they work at.
// Loaded once per user by the doctor shell, then kept current by live updates;
// actions throw with the server's message.
interface DoctorState {
    loadedFor: string | null
    status: Status
    error: string | null
    doctorId: string | null
    // Keyed by facility id
    hours: Record<string, IWorkingHour[]>
    appointments: Record<string, IAppointment[]>
    load: (user: IAuthUser) => Promise<void>
    // Re-reads visits, e.g. after the live connection dropped and events may have been missed
    refreshAppointments: () => Promise<void>
    // A visit as the server now has it, from a live update or a response
    applyAppointment: (appointment: IAppointment) => void
    cancelAppointment: (id: string, reason: string) => Promise<void>
    rescheduleAppointment: (id: string, startsAt: string) => Promise<void>
    addShift: (facilityId: string, shift: IWorkingHourInput) => Promise<void>
    removeShift: (facilityId: string, id: string) => Promise<void>
}

// The facilities of the user the store was last loaded for
let facilities: IFacility[] = []

function appointmentsAt(facility: IFacility) {
    const now = Date.now()
    return handleGetFacilityAppointments(facility.id, {
        from_date: clinicClock(new Date(now), facility.timezone).day,
        to_date: clinicClock(new Date(now + DAYS_AHEAD * DAY_MS), facility.timezone).day,
    }).then(unwrap)
}

export const useDoctorStore = create<DoctorState>((set, get) => {
    // Replaces the doctor's week at one facility with what the API saved
    const saveHours = async (facilityId: string, periods: IWorkingHourInput[]) => {
        const doctorId = get().doctorId
        if (!doctorId) throw new Error('Your schedule is still loading')
        const saved = unwrap(
            await handleSetWorkingHours(
                facilityId,
                doctorId,
                periods.map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time })),
            ),
        )
        set((state) => ({ hours: { ...state.hours, [facilityId]: saved } }))
    }

    const applyAppointment = (appointment: IAppointment) => {
        const facilityId = appointment.facility.id
        set((state) => {
            const list = state.appointments[facilityId] ?? []
            const next = list.some((a) => a.id === appointment.id)
                ? list.map((a) => (a.id === appointment.id ? appointment : a))
                : [...list, appointment]
            return { appointments: { ...state.appointments, [facilityId]: next } }
        })
    }

    return {
        loadedFor: null,
        status: 'idle',
        error: null,
        doctorId: null,
        hours: {},
        appointments: {},

        load: async (user) => {
            facilities = user.facilities
            set({ loadedFor: user.id, doctorId: user.id, status: 'loading', error: null })

            try {
                const loaded = await Promise.all(
                    user.facilities.map(async (facility) => {
                        // Staff get every doctor's hours there; keep the doctor's own.
                        // Appointments come back already narrowed to the doctor.
                        const [hours, appointments] = await Promise.all([
                            handleGetWorkingHours(facility.id).then(unwrap),
                            appointmentsAt(facility),
                        ])
                        return { id: facility.id, hours: hours.filter((hour) => hour.doctor_id === user.id), appointments }
                    }),
                )
                // A newer load (another login) wins
                if (get().loadedFor !== user.id) return
                set({
                    status: 'ready',
                    hours: Object.fromEntries(loaded.map((f) => [f.id, f.hours])),
                    appointments: Object.fromEntries(loaded.map((f) => [f.id, f.appointments])),
                })
            } catch (error) {
                if (get().loadedFor !== user.id) return
                set({ status: 'error', error: error instanceof Error ? error.message : 'Could not load your schedule' })
            }
        },

        refreshAppointments: async () => {
            const loadedFor = get().loadedFor
            if (get().status !== 'ready') return
            const loaded = await Promise.all(
                facilities.map(async (facility) => [facility.id, await appointmentsAt(facility)] as const),
            )
            if (get().loadedFor !== loadedFor) return
            set({ appointments: Object.fromEntries(loaded) })
        },

        applyAppointment,

        cancelAppointment: async (id, reason) => {
            applyAppointment(unwrap(await handleCancelAppointment(id, reason)))
        },

        rescheduleAppointment: async (id, startsAt) => {
            applyAppointment(unwrap(await handleRescheduleAppointment(id, startsAt)))
        },

        addShift: async (facilityId, shift) => {
            await saveHours(facilityId, [...(get().hours[facilityId] ?? []), shift])
        },

        removeShift: async (facilityId, id) => {
            await saveHours(facilityId, (get().hours[facilityId] ?? []).filter((hour) => hour.id !== id))
        },
    }
})

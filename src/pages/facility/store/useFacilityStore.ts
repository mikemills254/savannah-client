import { create } from 'zustand'
import {
    handleAddMember,
    handleBookForPatient,
    handleDeactivateMember,
    handleGetFacilityAppointments,
    handleGetMembers,
    handleGetWorkingHours,
    handleSetWorkingHours,
} from '../../../api/facility.ts'
import { handleCancelAppointment } from '../../../api/booking.ts'
import { unwrap } from '../../../api/request.ts'
import type { IAuthUser } from '../../../types/auth.types.ts'
import type {
    IAppointment,
    IAppointmentBooked,
    IMember,
    IWorkingHour,
    StaffRole,
} from '../../../types/facility.types.ts'
import { UserRole } from '../../../types/types.ts'
import { clinicClock, DAY_MS } from '../utils/clinicTime.ts'

// How much appointment history and future the facility pages work with
const DAYS_BACK = 30
const DAYS_AHEAD = 60

type Status = 'idle' | 'loading' | 'ready' | 'error'

// The facility's data, shared by every facility page. Loaded once per signed-in
// user by the page wrapper; each action is one request, and throws an ApiError
// with the server's message when it fails.
interface FacilityState {
    // The user the data was loaded for, so a different login reloads it
    loadedFor: string | null
    facilityId: string | null
    status: Status
    error: string | null
    members: IMember[]
    workingHours: IWorkingHour[]
    appointments: IAppointment[]
    load: (user: IAuthUser) => Promise<void>
    // Re-reads appointments, e.g. after another tab booked one
    refreshAppointments: () => Promise<void>
    // Returns an invite token when they have never set a password
    addMember: (details: { name: string; email: string; role: StaffRole }) => Promise<string | null>
    setMemberActive: (id: string, isActive: boolean) => Promise<void>
    addShift: (shift: Omit<IWorkingHour, 'id'>) => Promise<void>
    removeShift: (id: string) => Promise<void>
    cancelAppointment: (id: string, reason: string) => Promise<void>
    bookForPatient: (
        booking: { doctor_id: string; starts_at: string; patient: { email: string; name?: string } },
        idempotencyKey: string,
    ) => Promise<IAppointmentBooked>
}

let facilityId: string | null = null
let timeZone = 'UTC'

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
    return items.some((existing) => existing.id === item.id)
        ? items.map((existing) => (existing.id === item.id ? item : existing))
        : [...items, item]
}

function requireFacility(): string {
    if (!facilityId) throw new Error('Your facility is still loading')
    return facilityId
}

function appointmentRange() {
    const now = Date.now()
    return {
        from_date: clinicClock(new Date(now - DAYS_BACK * DAY_MS), timeZone).day,
        to_date: clinicClock(new Date(now + DAYS_AHEAD * DAY_MS), timeZone).day,
    }
}

export const useFacilityStore = create<FacilityState>((set, get) => {
    // Replaces one doctor's week with the schedule the API saved
    const saveDoctorHours = async (doctorId: string, hours: Omit<IWorkingHour, 'id'>[]) => {
        const saved = unwrap(
            await handleSetWorkingHours(
                requireFacility(),
                doctorId,
                hours.map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time })),
            ),
        )
        set((state) => ({
            workingHours: [...state.workingHours.filter((hour) => hour.doctor_id !== doctorId), ...saved],
        }))
    }

    return {
        loadedFor: null,
        facilityId: null,
        status: 'idle',
        error: null,
        members: [],
        workingHours: [],
        appointments: [],

        load: async (user) => {
            facilityId = user.facility_id
            timeZone = user.facility?.timezone ?? 'UTC'
            set({ loadedFor: user.id, facilityId: user.facility_id, status: 'loading', error: null })

            try {
                const id = requireFacility()
                // Doctors can't list the staff, and only need themselves on it
                const members =
                    user.role === UserRole.DOCTOR
                        ? Promise.resolve<IMember[]>([
                              {
                                  id: user.id,
                                  name: user.name,
                                  email: user.email,
                                  role: UserRole.DOCTOR,
                                  is_active: user.is_active,
                                  created_at: user.created_at,
                              },
                          ])
                        : handleGetMembers(id).then(unwrap)

                const [memberList, hours, appointments] = await Promise.all([
                    members,
                    handleGetWorkingHours(id).then(unwrap),
                    handleGetFacilityAppointments(id, appointmentRange()).then(unwrap),
                ])
                // A newer load (another login) wins
                if (get().loadedFor !== user.id) return
                set({ status: 'ready', members: memberList, workingHours: hours, appointments })
            } catch (error) {
                if (get().loadedFor !== user.id) return
                set({ status: 'error', error: error instanceof Error ? error.message : 'Could not load your clinic' })
            }
        },

        refreshAppointments: async () => {
            const appointments = unwrap(await handleGetFacilityAppointments(requireFacility(), appointmentRange()))
            set({ appointments })
        },

        addMember: async ({ name, email, role }) => {
            const { member, invite_token } = unwrap(
                await handleAddMember(requireFacility(), { email, role, name: name.trim() || undefined }),
            )
            set((state) => ({ members: upsert(state.members, member) }))
            return invite_token
        },

        setMemberActive: async (id, isActive) => {
            const existing = get().members.find((member) => member.id === id)
            if (!existing) return

            // Re-adding a deactivated member's email restores their account
            const member = isActive
                ? unwrap(await handleAddMember(requireFacility(), { email: existing.email, role: existing.role })).member
                : unwrap(await handleDeactivateMember(requireFacility(), id))
            set((state) => ({ members: upsert(state.members, member) }))
        },

        addShift: async (shift) => {
            const own = get().workingHours.filter((hour) => hour.doctor_id === shift.doctor_id)
            await saveDoctorHours(shift.doctor_id, [...own, shift])
        },

        removeShift: async (id) => {
            const shift = get().workingHours.find((hour) => hour.id === id)
            if (!shift) return
            const rest = get().workingHours.filter((hour) => hour.doctor_id === shift.doctor_id && hour.id !== id)
            await saveDoctorHours(shift.doctor_id, rest)
        },

        cancelAppointment: async (id, reason) => {
            const appointment = unwrap(await handleCancelAppointment(id, reason))
            set((state) => ({ appointments: upsert(state.appointments, appointment) }))
        },

        bookForPatient: async (booking, idempotencyKey) => {
            const booked = unwrap(await handleBookForPatient(requireFacility(), booking, idempotencyKey))
            set((state) => ({ appointments: upsert(state.appointments, booked.appointment) }))
            return booked
        },
    }
})

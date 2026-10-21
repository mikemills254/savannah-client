import type { IFacility } from './auth.types'
import type { UserRole } from './types'

export type AppointmentStatus = 'BOOKED' | 'CANCELLED'

export type StaffRole = UserRole.FACILITY_ADMIN | UserRole.DOCTOR

// A facility admin or doctor (GET /facilities/{id}/members). For a doctor,
// id is the doctor_id used by working hours and appointments
export interface IMember {
    id: string,
    name: string,
    email: string,
    role: StaffRole,
    // False once deactivated: they can't log in and a doctor takes no new bookings. History is kept
    is_active: boolean,
    // False until they accept their invite; they can't log in before then
    has_password: boolean,
    created_at: string
}

// POST /facilities/{id}/members
export interface IMemberCreated {
    member: IMember,
    // Set when they have never set a password; they use it on /auth/accept-invite
    invite_token: string | null
}

// A recurring weekly shift in the facility's local time
export interface IWorkingHour {
    id: string,
    doctor_id: string,
    // Monday = 0, Sunday = 6
    weekday: number,
    // "08:00:00"
    start_time: string,
    end_time: string
}

// A shift as sent in PUT .../working-hours, which replaces the doctor's whole week
export type IWorkingHourInput = Pick<IWorkingHour, 'weekday' | 'start_time' | 'end_time'>

export interface IPerson {
    id: string,
    name: string
}

export interface IFacilitySummary {
    id: string,
    name: string,
    // IANA name; every time the API returns is in this zone
    timezone: string
}

export interface IAppointment {
    id: string,
    status: AppointmentStatus,
    // ISO with the facility's UTC offset
    starts_at: string,
    ends_at: string,
    created_at: string,
    cancelled_at: string | null,
    doctor: IPerson,
    patient: IPerson,
    // The patient, or the facility admin who booked for them. Null on old bookings
    booked_by: IPerson | null,
    // Who cancelled: the patient, the doctor or a facility admin
    cancelled_by: IPerson | null,
    // Why it was cancelled. Null while booked and on old cancellations
    cancellation_reason: string | null,
    facility: IFacilitySummary
}

// POST /facilities/{id}/appointments
export interface IAppointmentBooked {
    appointment: IAppointment,
    // Set when the patient has never signed in; send it to them
    invite_token: string | null
}

// A patient who has booked at the facility (GET /facilities/{id}/patients)
export interface IPatient {
    id: string,
    name: string,
    email: string
}

// A bookable doctor (public)
export interface IDoctor {
    id: string,
    name: string,
    facility_id: string
}

export interface IDoctorDetail extends IDoctor {
    facility: IFacilitySummary,
    working_hours: IWorkingHour[]
}

export interface ISlot {
    // In the facility's local time
    starts_at: string,
    ends_at: string
}

export interface IAvailability {
    doctor_id: string,
    date: string,
    timezone: string,
    available_slots: ISlot[]
}

export interface IDoctorSlot extends ISlot {
    doctor_id: string
}

// A clinic in GET /facilities, with its soonest free slot in the next 14 days
export interface IBookableFacility extends IFacility {
    next_available: IDoctorSlot | null
}

// GET /facilities/{id}/availability: every active doctor's free slots, day by day
export interface IFacilityAvailability {
    facility_id: string,
    timezone: string,
    // Clinic-local dates, both inclusive
    from: string,
    to: string,
    next_available: IDoctorSlot | null,
    // One per day in the range, including days with nothing open
    days: { date: string, open_count: number }[],
    // Sorted by name
    doctors: IDoctorAvailability[]
}

export interface IDoctorAvailability {
    doctor_id: string,
    name: string,
    next_available: ISlot | null,
    // One per day in the range; empty when nothing is free
    days: { date: string, available_slots: ISlot[] }[]
}

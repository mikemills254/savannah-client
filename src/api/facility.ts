import { api } from "../lib/api";
import type {
    IAppointment,
    IAppointmentBooked,
    IMember,
    IMemberCreated,
    IPatient,
    IWorkingHour,
    IWorkingHourInput,
    StaffRole,
} from "../types/facility.types";
import type { IApiResponse } from "../types/types";
import { send } from "./request";

// --- Staff (facility admins) ---

export const handleGetMembers = (facilityId: string): Promise<IApiResponse<IMember[]>> =>
    send(() => api.get<IMember[]>(`/facilities/${facilityId}/members`), "Staff loaded")

// Also reactivates a deactivated member with this email
export const handleAddMember = (
    facilityId: string,
    data: { email: string; role: StaffRole; name?: string },
): Promise<IApiResponse<IMemberCreated>> =>
    send(() => api.post<IMemberCreated>(`/facilities/${facilityId}/members`, data), "Added to your staff")

export const handleDeactivateMember = (facilityId: string, memberId: string): Promise<IApiResponse<IMember>> =>
    send(
        () => api.post<IMember>(`/facilities/${facilityId}/members/${memberId}/deactivate`),
        "Deactivated",
    )

// --- Working hours ---

export const handleGetWorkingHours = (facilityId: string): Promise<IApiResponse<IWorkingHour[]>> =>
    send(() => api.get<IWorkingHour[]>(`/facilities/${facilityId}/working-hours`), "Working hours loaded")

// Replaces the doctor's whole weekly schedule
export const handleSetWorkingHours = (
    facilityId: string,
    doctorId: string,
    periods: IWorkingHourInput[],
): Promise<IApiResponse<IWorkingHour[]>> =>
    send(
        () => api.put<IWorkingHour[]>(`/facilities/${facilityId}/doctors/${doctorId}/working-hours`, { periods }),
        "Working hours saved",
    )

// --- Appointments ---

// Between two clinic-local dates, inclusive. Doctors only get their own
export const handleGetFacilityAppointments = (
    facilityId: string,
    range: { from_date: string; to_date: string },
): Promise<IApiResponse<IAppointment[]>> =>
    send(
        () => api.get<IAppointment[]>(`/facilities/${facilityId}/appointments`, { params: { ...range, limit: 500 } }),
        "Appointments loaded",
    )

// A facility admin booking for a patient; a new email gets an account and an invite
export const handleBookForPatient = (
    facilityId: string,
    data: { doctor_id: string; starts_at: string; patient: { email: string; name?: string } },
    idempotencyKey: string,
): Promise<IApiResponse<IAppointmentBooked>> =>
    send(
        () =>
            api.post<IAppointmentBooked>(`/facilities/${facilityId}/appointments`, data, {
                headers: { "Idempotency-Key": idempotencyKey },
            }),
        "Booked",
    )

// --- Patients ---

export const handleSearchPatients = (
    facilityId: string,
    search: string,
    signal?: AbortSignal,
): Promise<IApiResponse<IPatient[]>> =>
    send(
        () => api.get<IPatient[]>(`/facilities/${facilityId}/patients`, { params: { search, limit: 8 }, signal }),
        "Patients loaded",
    )

export const handleReissuePatientInvite = (
    facilityId: string,
    patientId: string,
): Promise<IApiResponse<{ invite_token: string }>> =>
    send(
        () => api.post<{ invite_token: string }>(`/facilities/${facilityId}/patients/${patientId}/invite`),
        "New invite ready",
    )

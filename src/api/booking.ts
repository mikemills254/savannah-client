import { api } from "../lib/api";
import type {
    IAppointment,
    IAvailability,
    IBookableFacility,
    IDoctorDetail,
    IFacilityAvailability,
} from "../types/facility.types";
import type { IApiResponse } from "../types/types";
import { send } from "./request";

// --- Public: browsing clinics and open slots ---

export const handleGetFacilities = (): Promise<IApiResponse<IBookableFacility[]>> =>
    send(() => api.get<IBookableFacility[]>("/facilities"), "Clinics loaded")

// Every doctor's free slots at a clinic, for `days` clinic-local days from today
export const handleGetFacilityAvailability = (
    facilityId: string,
    days: number,
    signal?: AbortSignal,
): Promise<IApiResponse<IFacilityAvailability>> =>
    send(
        () => api.get<IFacilityAvailability>(`/facilities/${facilityId}/availability`, { params: { days }, signal }),
        "Availability loaded",
    )

// A bookable doctor with their weekly hours at a clinic (facilityId, else their
// first) and every clinic they work at; 404 once they stop taking bookings there
export const handleGetDoctor = (
    doctorId: string,
    facilityId?: string,
    signal?: AbortSignal,
): Promise<IApiResponse<IDoctorDetail>> =>
    send(
        () => api.get<IDoctorDetail>(`/doctors/${doctorId}`, { params: { facility_id: facilityId }, signal }),
        "Doctor loaded",
    )

// Free slots on a clinic-local date ("2026-10-20"), at one clinic or, without
// facilityId, at each clinic the doctor works at
export const handleGetAvailability = (
    doctorId: string,
    date: string,
    facilityId?: string,
    signal?: AbortSignal,
): Promise<IApiResponse<IAvailability>> =>
    send(
        () =>
            api.get<IAvailability>(`/doctors/${doctorId}/availability`, {
                params: { date, facility_id: facilityId },
                signal,
            }),
        "Availability loaded",
    )

// --- Patient: their own visits ---

// The same idempotencyKey must be sent again when retrying the same booking,
// so a retry after a lost response returns the original booking. facility_id
// says which clinic, for a doctor who works at several.
export const handleBookAppointment = (
    data: { doctor_id: string; starts_at: string; facility_id?: string },
    idempotencyKey: string,
): Promise<IApiResponse<IAppointment>> =>
    send(
        () => api.post<IAppointment>("/appointments", data, { headers: { "Idempotency-Key": idempotencyKey } }),
        "You're booked",
    )

export const handleGetMyAppointments = (): Promise<IApiResponse<IAppointment[]>> =>
    send(() => api.get<IAppointment[]>("/appointments/me", { params: { limit: 100 } }), "Visits loaded")

// --- Any visit the user may see: their own, a doctor's own, or a facility admin's ---

// 404 for one the user can't see
export const handleGetAppointment = (appointmentId: string, signal?: AbortSignal): Promise<IApiResponse<IAppointment>> =>
    send(() => api.get<IAppointment>(`/appointments/${appointmentId}`, { signal }), "Visit loaded")

export const handleCancelAppointment = (
    appointmentId: string,
    reason: string,
): Promise<IApiResponse<IAppointment>> =>
    send(() => api.patch<IAppointment>(`/appointments/${appointmentId}/cancel`, { reason }), "Appointment cancelled")

// Same doctor, new start; the old slot is freed. 409 when the new one was just taken
export const handleRescheduleAppointment = (
    appointmentId: string,
    startsAt: string,
): Promise<IApiResponse<IAppointment>> =>
    send(
        () => api.patch<IAppointment>(`/appointments/${appointmentId}/reschedule`, { starts_at: startsAt }),
        "Visit moved",
    )

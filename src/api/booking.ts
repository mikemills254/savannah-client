import { api } from "../lib/api";
import type { IFacility } from "../types/auth.types";
import type {
    IAppointment,
    IAvailability,
    IDoctor,
    IDoctorDetail,
} from "../types/facility.types";
import type { IApiResponse } from "../types/types";
import { send } from "./request";

// --- Public: browsing clinics, doctors and open slots ---

export const handleGetFacilities = (): Promise<IApiResponse<IFacility[]>> =>
    send(() => api.get<IFacility[]>("/facilities"), "Clinics loaded")

export const handleGetFacilityDoctors = (facilityId: string): Promise<IApiResponse<IDoctor[]>> =>
    send(() => api.get<IDoctor[]>(`/facilities/${facilityId}/doctors`), "Doctors loaded")

export const handleGetDoctor = (doctorId: string): Promise<IApiResponse<IDoctorDetail>> =>
    send(() => api.get<IDoctorDetail>(`/doctors/${doctorId}`), "Doctor loaded")

// Free slots on a clinic-local date ("2026-10-20")
export const handleGetAvailability = (
    doctorId: string,
    date: string,
    signal?: AbortSignal,
): Promise<IApiResponse<IAvailability>> =>
    send(
        () => api.get<IAvailability>(`/doctors/${doctorId}/availability`, { params: { date }, signal }),
        "Availability loaded",
    )

// --- Patient: their own visits ---

// The same idempotencyKey must be sent again when retrying the same booking,
// so a retry after a lost response returns the original booking
export const handleBookAppointment = (
    data: { doctor_id: string; starts_at: string },
    idempotencyKey: string,
): Promise<IApiResponse<IAppointment>> =>
    send(
        () => api.post<IAppointment>("/appointments", data, { headers: { "Idempotency-Key": idempotencyKey } }),
        "You're booked",
    )

export const handleGetMyAppointments = (): Promise<IApiResponse<IAppointment[]>> =>
    send(() => api.get<IAppointment[]>("/appointments/me", { params: { limit: 100 } }), "Visits loaded")

export const handleCancelAppointment = (
    appointmentId: string,
    reason: string,
): Promise<IApiResponse<IAppointment>> =>
    send(() => api.patch<IAppointment>(`/appointments/${appointmentId}/cancel`, { reason }), "Appointment cancelled")

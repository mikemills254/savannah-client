import { api } from "../lib/api";
import type { IFacility } from "../types/auth.types";
import type { IDoctor } from "../types/facility.types";
import type { IApiResponse } from "../types/types";
import { send } from "./request";

// Platform admin (SUPER_ADMIN) requests. Staff management reuses the member
// wrappers in facility.ts: a super admin may manage members at any clinic.

// Starts active, so it's listed (and bookable) right away. Add its first
// admin next with handleAddMember. timezone must be an IANA name
export const handleCreateFacility = (data: { name: string; timezone: string }): Promise<IApiResponse<IFacility>> =>
    send(() => api.post<IFacility>("/facilities", data), "Clinic created")

// Public: the clinic's active doctors, i.e. who patients can pick there
export const handleGetFacilityDoctors = (facilityId: string): Promise<IApiResponse<IDoctor[]>> =>
    send(() => api.get<IDoctor[]>(`/facilities/${facilityId}/doctors`), "Doctors loaded")

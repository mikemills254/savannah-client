import type { UserRole } from "./types";

export interface IRegister {
    name: string,
    email: string,
    password: string,
    facilityName: string | null,
    timezone: string | null
}

export interface ILogin {
    email: string,
    password: string
}

export interface IFacility {
    id: string,
    name: string,
    timezone: string,
    is_active: boolean,
    created_at: string
}

// The signed-in user, as returned by /auth/me and inside login/register responses
export interface IAuthUser {
    id: string,
    role: UserRole,
    name: string,
    email: string,
    is_active: boolean,
    created_at: string,
    // Set for FACILITY_ADMIN and DOCTOR, null otherwise
    facility_id: string | null,
    // The staff member's facility
    facility: IFacility | null
}

// Body of POST /auth/register and /auth/login
export interface IAuthResponse {
    access_token: string,
    token_type: string,
    user: IAuthUser
}
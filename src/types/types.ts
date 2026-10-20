export enum UserRole {
    "SUPER_ADMIN" = "SUPER_ADMIN",
    "FACILITY_ADMIN" = "FACILITY_ADMIN",
    "DOCTOR" = "DOCTOR",
    "PATIENT" = "PATIENT"
}

export interface ErrorResponse {
    error: string;
    message: string;
    status?: number;
    details?: unknown
}

export interface IApiResponse<T =  undefined> {
    message: string;
    success: boolean;
    data?: T;
    // HTTP status of a failed request (409 = slot just taken); null when the server wasn't reached
    status?: number | null;
}
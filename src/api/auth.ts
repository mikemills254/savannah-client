import { api, ApiError } from "../lib/api";
import { handleAxiosError } from "../lib/axioErrorHandler";
import type { IAuthResponse, IAuthUser, IFacility, ILogin, IRegister } from "../types/auth.types";
import { UserRole, type IApiResponse } from "../types/types";
import { send } from "./request";

export const handleSignUp = async (data: IRegister):Promise<IApiResponse<IAuthResponse>> => {
    try {
        // The API takes snake_case; a facility_name makes this a clinic sign-up
        const { facilityName, ...rest } = data
        const response = await api.post<IAuthResponse>("/auth/register", { ...rest, facility_name: facilityName })

        return {
            message: response.data.user.role === UserRole.FACILITY_ADMIN ? "Clinic application received" : "Account created",
            success: true,
            data: response.data
        }
    } catch (error) {
        const thisError = handleAxiosError(error)

        return {
            message: thisError.message,
            success: false
        }
    }
}

export const handleLogin = async (data: ILogin):Promise<IApiResponse<IAuthResponse>> => {
    try {
        const response = await api.post<IAuthResponse>("/auth/login", data)

        return {
            message: "Logged in",
            success: true,
            data: response.data
        }
    } catch (error) {
        const thisError = handleAxiosError(error)

        return {
            message: thisError.message,
            success: false
        }
    }
}

// Signs in, or signs up as a patient, with the ID token Google Identity Services hands back
export const handleGoogleLogin = async (idToken: string):Promise<IApiResponse<IAuthResponse>> => {
    try {
        const response = await api.post<IAuthResponse>("/auth/google", { id_token: idToken })

        return {
            message: "Logged in",
            success: true,
            data: response.data
        }
    } catch (error) {
        const thisError = handleAxiosError(error)
        const status = error instanceof ApiError ? error.status : null

        return {
            // 503: the server has no Google client id set, so point them back to the form
            message: status === 503 ? "Google sign-in isn't available right now. Use your email and password." : thisError.message,
            success: false,
            status
        }
    }
}

// Sets the first password of an invited account (staff, or a patient a clinic
// booked for) and logs them in
export const handleAcceptInvite = async (data: { token: string, password: string }):Promise<IApiResponse<IAuthResponse>> => {
    try {
        const response = await api.post<IAuthResponse>("/auth/accept-invite", data)

        return {
            message: "Password set",
            success: true,
            data: response.data
        }
    } catch (error) {
        const thisError = handleAxiosError(error)

        return {
            message: thisError.message,
            success: false
        }
    }
}

export const handleGetFacility = (facilityId: string): Promise<IApiResponse<IFacility>> =>
    send(() => api.get<IFacility>(`/facilities/${facilityId}`), "Facility loaded")

// The signed-in user (the API client attaches the stored token)
export const handleGetMe = async ():Promise<IApiResponse<IAuthUser>> => {
    try {
        const response = await api.get<IAuthUser>("/auth/me")

        return {
            message: "Profile loaded",
            success: true,
            data: response.data
        }
    } catch (error) {
        const thisError = handleAxiosError(error)

        return {
            message: thisError.message,
            success: false
        }
    }
}
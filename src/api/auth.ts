import { api } from "../lib/api";
import { handleAxiosError } from "../lib/axioErrorHandler";
import type { IAuthResponse, IAuthUser, ILogin, IRegister } from "../types/auth.types";
import { UserRole, type IApiResponse } from "../types/types";

export const handleSignUp = async (data: IRegister):Promise<IApiResponse<IAuthResponse>> => {
    try {
        const response = await api.post<IAuthResponse>("/auth/register", data)

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
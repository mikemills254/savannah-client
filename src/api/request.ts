import { ApiError } from "../lib/api";
import { handleAxiosError } from "../lib/axioErrorHandler";
import type { IApiResponse } from "../types/types";

// Runs a request and wraps the outcome in an IApiResponse, keeping the HTTP
// status of a failure so callers can branch on it (409 = slot just taken)
export const send = async <T>(
    request: () => Promise<{ data: T }>,
    message: string,
): Promise<IApiResponse<T>> => {
    try {
        const response = await request()

        return {
            message,
            success: true,
            data: response.data
        }
    } catch (error) {
        if (error instanceof ApiError) {
            return {
                message: error.message,
                success: false,
                status: error.status
            }
        }

        return {
            message: handleAxiosError(error).message,
            success: false,
            status: null
        }
    }
}

// Unwraps an IApiResponse for code that prefers exceptions (stores, effects)
export const unwrap = <T>(results: IApiResponse<T>): T => {
    if (!results.success || results.data === undefined) {
        throw new ApiError(results.message, results.status ?? null)
    }
    return results.data
}

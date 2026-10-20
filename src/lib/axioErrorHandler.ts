import axios from "axios";
import type { ErrorResponse } from "../types/types";

export const handleAxiosError = (error: unknown): ErrorResponse => {
    if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data?.message;
        return {
            error: error.name || "AxiosError",
            message: responseMessage || error.message || "Request failed",
            status: error.response?.status || 0,
            details: error.response?.data || error,
        };
    }

    if (error instanceof Error) {
        return {
            error: error.name || "Error",
            message: error.message || "An unexpected error occurred",
            status: 0,
            details: {
                stack: error.stack
            }
        };
    }

    return {
        error: "UnknownError",
        message: "An unexpected error occurred",
        status: 0,
        details: error
    };
};
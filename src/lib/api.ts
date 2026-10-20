import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// An empty base URL keeps requests same-origin, so in dev they go through the
// Vite proxy (/auth, /facilities → FastAPI). Set VITE_API_BASE_URL in production.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
    timeout: 15_000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Rejected value of every failed request, so callers can show `err.message`
// and branch on `err.status` (e.g. 409 for "email already registered").
export class ApiError extends Error {
    readonly status: number | null;
    readonly data: unknown;

    constructor(message: string, status: number | null, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// FastAPI errors look like { detail: "message" } or, for validation errors,
// { detail: [{ msg: "...", loc: [...] }, ...] }.
function messageFrom(error: AxiosError): string {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
        return 'The server took too long to respond. Please try again.';
    }
    if (!error.response) {
        return "Can't reach the server. Check your connection and try again.";
    }

    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') {
        return detail;
    }
    if (Array.isArray(detail)) {
        return detail.map((d: { msg?: string }) => d?.msg ?? 'Invalid field').join(', ');
    }
    return `Request failed (${error.response.status}).`;
}

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token && !config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        // Cancelled requests (AbortController) aren't failures; pass them through untouched.
        if (axios.isCancel(error) || !axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        // The API issues no refresh tokens, so a 401 on an authenticated request means
        // the session expired or was revoked: sign out and let the UI route to login.
        // Only do it if the rejected token is still the current one, so a slow request
        // can't sign out a session that has since logged in again. Unauthenticated
        // 401s (wrong password on /auth/login) are left for the caller to handle.
        if (error.response?.status === 401) {
            const sent = error.config?.headers.get('Authorization');
            const { token, logout } = useAuthStore.getState();
            if (token && sent === `Bearer ${token}`) {
                logout();
            }
        }

        return Promise.reject(new ApiError(messageFrom(error), error.response?.status ?? null, error.response?.data));
    },
);

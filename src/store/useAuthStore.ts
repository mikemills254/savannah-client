import { create } from 'zustand'
import {
    handleAcceptInvite,
    handleGetFacility,
    handleGetMe,
    handleGoogleLogin,
    handleLogin,
    handleSignUp,
} from '../api/auth.ts'
import type { IAuthUser, ILogin, IRegister } from '../types/auth.types.ts'

// Staff should arrive with their facilities listed; until the API fills that in,
// look up the one facility_id names so pages can always read user.facilities
async function withFacilities(user: IAuthUser): Promise<IAuthUser> {
    const facilities = user.facilities ?? []
    if (facilities.length > 0 || !user.facility_id) return { ...user, facilities }

    const response = await handleGetFacility(user.facility_id)
    return { ...user, facilities: response.success && response.data ? [response.data] : [] }
}

interface AuthState {
    token: string | null
    user: IAuthUser | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (credentials: ILogin) => Promise<IAuthUser>
    // A Google ID token; a new Google user becomes a patient
    loginWithGoogle: (idToken: string) => Promise<IAuthUser>
    register: (payload: IRegister) => Promise<IAuthUser>
    acceptInvite: (data: { token: string; password: string }) => Promise<IAuthUser>
    logout: () => void
    initialize: () => Promise<void>
    refreshUser: () => Promise<void>
}

const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token') || localStorage.getItem('access_token')
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: getStoredToken(),
    user: null,
    isLoading: false,
    isAuthenticated: Boolean(getStoredToken()),

    login: async (credentials) => {
        set({ isLoading: true })
        try {
            const results = await handleLogin(credentials)
            // handleLogin reports failure in its result; surface it to callers as an error
            if (!results.success || !results.data) {
                throw new Error(results.message)
            }

            // The login response already carries the profile, so no extra /auth/me request
            const { access_token } = results.data
            const user = await withFacilities(results.data.user)
            localStorage.setItem('token', access_token)
            set({ token: access_token, user, isAuthenticated: true })
            return user
        } finally {
            set({ isLoading: false })
        }
    },

    loginWithGoogle: async (idToken) => {
        set({ isLoading: true })
        try {
            const results = await handleGoogleLogin(idToken)
            if (!results.success || !results.data) {
                throw new Error(results.message)
            }

            // Same response as a password login
            const { access_token } = results.data
            const user = await withFacilities(results.data.user)
            localStorage.setItem('token', access_token)
            set({ token: access_token, user, isAuthenticated: true })
            return user
        } finally {
            set({ isLoading: false })
        }
    },

    register: async (payload) => {
        set({ isLoading: true })
        try {
            const results = await handleSignUp(payload)
            // handleSignUp reports failure in its result; surface it to callers as an error
            if (!results.success || !results.data) {
                throw new Error(results.message)
            }

            // Sign-up logs the user in: the response carries a token and the profile
            const { access_token } = results.data
            const user = await withFacilities(results.data.user)
            localStorage.setItem('token', access_token)
            set({ token: access_token, user, isAuthenticated: true })
            return user
        } finally {
            set({ isLoading: false })
        }
    },

    acceptInvite: async (data) => {
        set({ isLoading: true })
        try {
            const results = await handleAcceptInvite(data)
            if (!results.success || !results.data) {
                throw new Error(results.message)
            }

            // Accepting an invite logs the user in, like sign-up
            const { access_token } = results.data
            const user = await withFacilities(results.data.user)
            localStorage.setItem('token', access_token)
            set({ token: access_token, user, isAuthenticated: true })
            return user
        } finally {
            set({ isLoading: false })
        }
    },

    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('access_token')
        set({ token: null, user: null, isAuthenticated: false })
    },

    initialize: async () => {
        if (!get().token || get().user) return
        await get().refreshUser()
    },

    // Re-reads the profile even when one is already loaded
    refreshUser: async () => {
        if (!get().token) return

        const results = await handleGetMe()
        if (results.success && results.data) {
            set({ user: await withFacilities(results.data), isAuthenticated: true })
        }
        // A rejected token (401) is signed out by the API client's interceptor. Other
        // failures (server down, offline) keep the session instead of logging the user out.
    },
}))

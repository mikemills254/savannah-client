import { homePath } from '../lib/homePath.ts'
import { useAuthStore } from '../store/useAuthStore.ts'

// Target for "Go to dashboard" links. After a reload only the token is known, so until the
// profile loads this points at /auth/login, which forwards signed-in users to their home.
export function useHomePath() {
    const user = useAuthStore((s) => s.user)
    return user ? homePath(user) : '/auth/login'
}

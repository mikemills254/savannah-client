import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { HomeRedirect } from './privateRoutes.tsx'

// Signed-in users skip the auth pages and go to their home
export function PublicRoute() {
    const token = useAuthStore((s) => s.token)

    if (token) {
        return <HomeRedirect />
    }

    return <Outlet />
}

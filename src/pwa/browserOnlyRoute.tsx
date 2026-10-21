import { Navigate, Outlet } from 'react-router-dom'
import { isStandalone } from './install.ts'

// The marketing pages are for the browser. Inside the installed app they'd be
// a detour, so the app opens straight onto sign-in instead.
export function BrowserOnlyRoute() {
    return isStandalone() ? <Navigate to="/auth/login" replace /> : <Outlet />
}

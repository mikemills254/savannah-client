import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { DashboardCard, DashboardShell } from '../../pages/DashboardShell.tsx';
import { homePath } from '../../lib/homePath.ts';
import LiveUpdates from '../live/liveUpdates.tsx';
import { useAuthStore } from '../../store/useAuthStore.ts';
import type { UserRole } from '../../types/types.ts';

export function Notice({ title, children }: { title: string; children: ReactNode }) {
    return (
        <DashboardShell>
            <DashboardCard>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--copy)' }}>{title}</h1>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--copy-light)', lineHeight: 1.5 }}>
                    {children}
                </div>
            </DashboardCard>
        </DashboardShell>
    )
}

interface PrivateRouteProps {
    // Roles allowed in; anyone else is sent to their own home
    roles?: UserRole[]
    // Send the user to their home instead of rendering child routes
    home?: boolean
}

// Layout route for every signed-in page: loads the user, sends visitors to log in,
// keeps each role on its own pages, and hands the user to child routes
export function PrivateRoute({ roles, home }: PrivateRouteProps) {
    const token = useAuthStore((s) => s.token)
    const user = useAuthStore((s) => s.user)
    const refreshUser = useAuthStore((s) => s.refreshUser)
    const [loadFailed, setLoadFailed] = useState(false)
    // Set on facility-scoped routes like /:facilityId/doctors
    const { facilityId } = useParams()

    useEffect(() => {
        // After a page reload only the token survives, so fetch the profile
        if (!token || user) return
        let cancelled = false
        refreshUser().then(() => {
            if (!cancelled && !useAuthStore.getState().user) setLoadFailed(true)
        })
        return () => {
            cancelled = true
        }
    }, [token, user, refreshUser])

    // A rejected token is cleared by the API client, which lands here too
    if (!token) {
        return <Navigate to="/auth/login" replace />
    }

    if (!user) {
        return loadFailed ? (
            <Notice title="We couldn’t load your account">
                <p style={{ margin: 0 }}>Check your connection and try again.</p>
                <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '1.25rem' }}
                    onClick={() => {
                        setLoadFailed(false)
                        refreshUser().then(() => setLoadFailed(!useAuthStore.getState().user))
                    }}
                >
                    Try again
                </button>
            </Notice>
        ) : (
            <Notice title="Loading your dashboard…">{null}</Notice>
        )
    }

    if (home || (roles && !roles.includes(user.role))) {
        return <Navigate to={homePath(user)} replace />
    }

    if (facilityId && !user.facility_id) {
        // Redirecting would loop: an admin's home is their facility page
        return (
            <Notice title="No clinic on your account">
                Ask your clinic admin to add you to their clinic again.
            </Notice>
        )
    }

    // Users only see facilities they work at; any other id in the URL goes to their home
    const ownFacility = facilityId === user.facility_id || user.facilities.some((f) => f.id === facilityId)
    if (facilityId && !ownFacility) {
        return <Navigate to={homePath(user)} replace />
    }

    // Child routes read the user with useCurrentUser(). Live updates stay
    // connected while the user moves between their pages.
    return (
        <>
            <LiveUpdates user={user} />
            <Outlet context={user} />
        </>
    )
}

// Sends a signed-in user to their role's home, loading their profile first if needed
export function HomeRedirect() {
    return <PrivateRoute home />
}

// Unknown URLs: anyone with a session goes to their home, visitors to the landing page
export function FallbackRoute() {
    const token = useAuthStore((s) => s.token)

    return token ? <HomeRedirect /> : <Navigate to="/" replace />
}

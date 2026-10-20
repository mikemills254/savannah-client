import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore.ts'
import type { IAuthUser } from '../types/auth.types.ts'
import type { UserRole } from '../types/types.ts'
import { DashboardCard, DashboardShell } from './DashboardShell.tsx'

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

interface UserGateProps {
  // Roles allowed in; anyone else is sent to /dashboard, which knows where they belong
  roles?: UserRole[]
  children: (user: IAuthUser) => ReactNode
}

// Every signed-in page: loads the user, sends visitors to log in, and keeps
// each role on its own pages
export function UserGate({ roles, children }: UserGateProps) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const [loadFailed, setLoadFailed] = useState(false)

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
    return <Navigate to="/login" replace />
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

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children(user)}</>
}

import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore.ts'
import { Logo } from '../website/components/Logo.tsx'

// Header and page frame shared by every role's dashboard
export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border)',
          padding: '1rem 0',
        }}
      >
        <div className="site-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none' }} aria-label="DocConnect Homepage">
            <Logo variant="horizontal" height={36} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '3rem 0' }}>
        <div className="site-container" style={{ maxWidth: '800px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

// White card used for the main block of a dashboard
export function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '2.5rem',
        marginBottom: '2rem',
      }}
    >
      {children}
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { useHomePath } from '../../hooks/useHomePath.ts'
import { Logo } from './Logo.tsx'
import { LuMenu, LuX, LuArrowRight } from 'react-icons/lu'

interface NavbarProps {
  hasClinics?: boolean
}

export function Navbar({ hasClinics = false }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const home = useHomePath()

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(243, 241, 247, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        transition: 'all 0.2s ease',
      }}
    >
      <div className="site-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
        {/* Brand Logo */}
        <Link
          to="/"
          style={{ textDecoration: 'none' }}
          aria-label="DocConnect Homepage"
        >
          <Logo variant="horizontal" height={38} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '2rem',
          }}
          className="desktop-nav"
          aria-label="Main Navigation"
        >
          <a
            href="#how-it-works"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--copy-light)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--copy-light)')}
          >
            How it works
          </a>
          <a
            href="#why-reliable"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--copy-light)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--copy-light)')}
          >
            Why it's reliable
          </a>
          {hasClinics && (
            <a
              href="#clinics"
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--copy-light)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--copy-light)')}
            >
              Clinics
            </a>
          )}
          <Link
            to="/for-clinics"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--copy-light)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--copy-light)')}
          >
            For clinics
          </Link>
        </nav>

        {/* Desktop Auth CTAs */}
        <div style={{ display: 'none', alignItems: 'center', gap: '0.85rem' }} className="desktop-ctas">
          {isAuthenticated ? (
            <>
              <Link to={home} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
                Go to dashboard
                <LuArrowRight style={{ width: '1rem', height: '1rem' }} />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="btn btn-ghost"
                style={{ padding: '0.6rem 1rem', fontSize: '0.875rem' }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="btn btn-ghost" style={{ padding: '0.6rem 1.1rem', fontSize: '0.875rem' }}>
                Log in
              </Link>
              <Link to="/auth/register" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
                Create free account
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="mobile-toggle"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem',
            color: 'var(--copy)',
          }}
        >
          {mobileMenuOpen ? <LuX style={{ width: '1.4rem', height: '1.4rem' }} /> : <LuMenu style={{ width: '1.4rem', height: '1.4rem' }} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--foreground)',
            borderBottom: '1px solid var(--border)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <a
            href="#how-it-works"
            onClick={closeMobileMenu}
            style={{ padding: '0.5rem 0', color: 'var(--copy)', fontWeight: 500 }}
          >
            How it works
          </a>
          <a
            href="#why-reliable"
            onClick={closeMobileMenu}
            style={{ padding: '0.5rem 0', color: 'var(--copy)', fontWeight: 500 }}
          >
            Why it's reliable
          </a>
          {hasClinics && (
            <a
              href="#clinics"
              onClick={closeMobileMenu}
              style={{ padding: '0.5rem 0', color: 'var(--copy)', fontWeight: 500 }}
            >
              Clinics
            </a>
          )}
          <Link
            to="/for-clinics"
            onClick={closeMobileMenu}
            style={{ padding: '0.5rem 0', color: 'var(--copy)', fontWeight: 500 }}
          >
            For clinics
          </Link>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to={home} onClick={closeMobileMenu} className="btn btn-primary" style={{ width: '100%' }}>
                Go to dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout()
                  closeMobileMenu()
                }}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/auth/register" onClick={closeMobileMenu} className="btn btn-primary" style={{ width: '100%' }}>
                Create free account
              </Link>
              <Link to="/auth/login" onClick={closeMobileMenu} className="btn btn-secondary" style={{ width: '100%' }}>
                Log in
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Media query styling for responsive desktop vs mobile view */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-ctas { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .mobile-toggle { display: inline-flex !important; }
        }
      `}</style>
    </header>
  )
}

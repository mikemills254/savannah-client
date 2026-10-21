import { Link } from 'react-router-dom'
import { Logo } from './Logo.tsx'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: '#ffffff',
        padding: '3rem 0 2rem',
        marginTop: '4rem',
      }}
    >
      <div className="site-container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Brand mark */}
          <Link to="/" style={{ textDecoration: 'none' }} aria-label="DocConnect Homepage">
            <Logo variant="horizontal" height={34} />
          </Link>

          {/* Quick links */}
          <nav
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--copy-light)',
            }}
            aria-label="Footer Navigation"
          >
            <a href="#how-it-works" style={{ transition: 'color 0.2s' }}>How it works</a>
            <a href="#why-reliable" style={{ transition: 'color 0.2s' }}>Why it's reliable</a>
            <Link to="/for-clinics" style={{ transition: 'color 0.2s' }}>For clinics</Link>
            <Link to="/docs" style={{ transition: 'color 0.2s' }}>Docs</Link>
            <Link to="/auth/register" style={{ transition: 'color 0.2s' }}>Create free account</Link>
            <Link to="/auth/login" style={{ transition: 'color 0.2s' }}>Log in</Link>
          </nav>
        </div>

        {/* Bottom copyright notice */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--copy-lighter)',
          }}
        >
          <p style={{ margin: 0 }}>
            &copy; {currentYear} DocConnect. Direct doctor appointment scheduling for clinics and hospitals.
          </p>
          <p style={{ margin: 0 }}>
            Book Appointments. Better Health.
          </p>
        </div>
      </div>
    </footer>
  )
}

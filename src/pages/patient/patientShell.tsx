import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LuCalendarPlus, LuLogOut, LuTicket } from 'react-icons/lu'
import LiveBadge from '../../components/live/liveBadge.tsx'
import { cn } from '../../lib/cn.ts'
import { initials } from '../../lib/initials.ts'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { Logo } from '../../website/components/Logo.tsx'

const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
        isActive ? 'bg-primary text-white' : 'text-copy-light hover:bg-accent-bg hover:text-primary',
    )

// Top bar and page frame for patients
export default function PatientShell({ children }: { children: ReactNode }) {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
                <div className="site-container flex h-16 items-center gap-3">
                    <Link to="/" aria-label="DocConnect Homepage" className="mr-auto">
                        <Logo variant="horizontal" height={32} />
                    </Link>

                    <nav className="flex items-center gap-1" aria-label="Patient">
                        <NavLink to="/visits" end className={navLink}>
                            <LuTicket className="size-4" />
                            <span className="hidden sm:inline">My visits</span>
                        </NavLink>
                        <NavLink to="/book" className={navLink}>
                            <LuCalendarPlus className="size-4" />
                            <span className="hidden sm:inline">Book a visit</span>
                        </NavLink>
                    </nav>

                    <LiveBadge />
                    {user && (
                        <span
                            className="ml-1 hidden size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-secondary sm:grid"
                            title={user.name}
                        >
                            {initials(user.name)}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            logout()
                            navigate('/')
                        }}
                        aria-label="Log out"
                        className="flex items-center gap-2 rounded-full border border-border bg-transparent p-2 text-sm font-medium text-copy-light hover:border-primary-light hover:text-primary"
                    >
                        <LuLogOut className="size-4" />
                    </button>
                </div>
            </header>

            <main className="site-container py-8 sm:py-10">{children}</main>
        </div>
    )
}

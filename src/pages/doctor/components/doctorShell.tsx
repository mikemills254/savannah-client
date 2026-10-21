import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LuCalendarClock, LuLayoutDashboard, LuLogOut, LuRefreshCw } from 'react-icons/lu'
import LiveBadge from '../../../components/live/liveBadge.tsx'
import { cn } from '../../../lib/cn.ts'
import { initials } from '../../../lib/initials.ts'
import { useAuthStore } from '../../../store/useAuthStore.ts'
import { Logo } from '../../../website/components/Logo.tsx'
import { useDoctorStore } from '../store/useDoctorStore.ts'

const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
        isActive ? 'bg-primary text-white' : 'text-copy-light hover:bg-accent-bg hover:text-primary',
    )

// Top bar and page frame for doctors. Also loads their hours and visits, once per user.
export default function DoctorShell({ children }: { children: ReactNode }) {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const loadedFor = useDoctorStore((s) => s.loadedFor)
    const status = useDoctorStore((s) => s.status)
    const error = useDoctorStore((s) => s.error)
    const load = useDoctorStore((s) => s.load)

    useEffect(() => {
        if (user && loadedFor !== user.id) load(user)
    }, [user, loadedFor, load])

    const ready = status === 'ready' && loadedFor === user?.id

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
                <div className="site-container flex h-16 items-center gap-3">
                    <Link to="/doctor" aria-label="Your overview" className="mr-auto">
                        <Logo variant="horizontal" height={32} />
                    </Link>

                    <nav className="flex items-center gap-1" aria-label="Doctor">
                        <NavLink to="/doctor" end className={navLink}>
                            <LuLayoutDashboard className="size-4" />
                            <span className="hidden sm:inline">Overview</span>
                        </NavLink>
                        <NavLink to="/doctor/hours" className={navLink}>
                            <LuCalendarClock className="size-4" />
                            <span className="hidden sm:inline">My hours</span>
                        </NavLink>
                    </nav>

                    <LiveBadge />
                    {user && (
                        <span
                            className="ml-1 hidden size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-secondary sm:grid"
                            title={`${user.name} · Doctor`}
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

            <main className="site-container py-8 sm:py-10">
                {ready ? (
                    children
                ) : status === 'error' ? (
                    <div className="rounded-lg border border-border bg-white px-6 py-14 text-center shadow-sm">
                        <p className="m-0 text-base font-semibold text-copy">We couldn't load your schedule</p>
                        <p className="m-0 mt-1 text-sm text-copy-light">{error}</p>
                        <button type="button" onClick={() => user && load(user)} className="btn btn-primary mt-5">
                            <LuRefreshCw className="size-4" />
                            Try again
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
                        <div className="h-14 w-72 animate-pulse rounded-md bg-white" />
                        <div className="h-40 animate-pulse rounded-lg bg-white" />
                        <div className="h-80 animate-pulse rounded-lg bg-white" />
                    </div>
                )}
            </main>
        </div>
    )
}

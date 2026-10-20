import { Link, NavLink } from 'react-router-dom'
import type { IconType } from 'react-icons'
import { LuCalendarDays, LuClock, LuLayoutDashboard, LuSettings, LuStethoscope, LuX } from 'react-icons/lu'
import { Logo } from '../../../../website/components/Logo.tsx'
import type { IAuthUser } from '../../../../types/auth.types.ts'
import { UserRole } from '../../../../types/types.ts'
import { cn } from '../../../../lib/cn.ts'

interface NavItem {
    to: string
    label: string
    // Doctors see a shorter menu, worded for their own schedule
    doctorLabel?: string
    icon: IconType
    adminOnly?: boolean
}

const links: NavItem[] = [
    { to: '/dashboard', label: 'Overview', icon: LuLayoutDashboard },
    { to: '/dashboard/doctors', label: 'Doctors', icon: LuStethoscope, adminOnly: true },
    { to: '/dashboard/appointments', label: 'Appointments', doctorLabel: 'My appointments', icon: LuCalendarDays },
    { to: '/dashboard/hours', label: 'Working hours', doctorLabel: 'My hours', icon: LuClock },
    { to: '/dashboard/settings', label: 'Settings', icon: LuSettings, adminOnly: true },
]

interface SidebarProps {
    user: IAuthUser | null
    open: boolean
    onClose: () => void
}

// Fixed on large screens, a slide-in drawer below that
export default function Sidebar({ user, open, onClose }: SidebarProps) {
    const isDoctor = user?.role === UserRole.DOCTOR
    const facility = user?.facility ?? null

    return (
        <>
            {/* Backdrop behind the drawer on small screens */}
            <div
                onClick={onClose}
                className={cn(
                    'fixed inset-0 z-40 bg-ink/40 transition-opacity lg:hidden',
                    open ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
            />

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white transition-transform duration-300 lg:translate-x-0',
                    open ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-border px-5">
                    <Link to="/" aria-label="DocConnect Homepage">
                        <Logo variant="horizontal" height={32} />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded-sm border-0 bg-transparent p-1.5 text-copy-light hover:bg-accent-bg lg:hidden"
                    >
                        <LuX className="size-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-3">
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                        {links
                            .filter((link) => !(isDoctor && link.adminOnly))
                            .map(({ to, label, doctorLabel, icon: Icon }) => (
                                <li key={to}>
                                    <NavLink
                                        to={to}
                                        end
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            cn(
                                                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-accent-bg text-primary'
                                                    : 'text-copy-light hover:bg-background hover:text-copy',
                                            )
                                        }
                                    >
                                        <Icon className="size-[18px] shrink-0" />
                                        {(isDoctor && doctorLabel) || label}
                                    </NavLink>
                                </li>
                            ))}
                    </ul>
                </nav>

                {facility && (
                    <div className="m-3 rounded-md border border-accent-border bg-accent-bg p-3">
                        <p className="m-0 truncate text-sm font-semibold text-copy">{facility.name}</p>
                        <p className="m-0 mt-0.5 truncate text-xs text-copy-light">
                            {facility.timezone.replace(/_/g, ' ')}
                        </p>
                    </div>
                )}
            </aside>
        </>
    )
}

import { useNavigate } from 'react-router-dom'
import { LuLogOut, LuMenu } from 'react-icons/lu'
import LiveBadge from '../../../../components/live/liveBadge.tsx'
import { initials } from '../../../../lib/initials.ts'
import { useAuthStore } from '../../../../store/useAuthStore.ts'
import type { IAuthUser } from '../../../../types/auth.types.ts'

interface NavbarProps {
    user: IAuthUser | null
    title?: string
    onMenuClick: () => void
}

export default function Navbar({ user, title, onMenuClick }: NavbarProps) {
    const navigate = useNavigate()
    const logout = useAuthStore((s) => s.logout)

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6">
            <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open menu"
                className="rounded-sm border border-border bg-transparent p-2 text-copy hover:bg-accent-bg lg:hidden"
            >
                <LuMenu className="size-5" />
            </button>

            <h1 className="min-w-0 flex-1 truncate text-base font-bold sm:text-lg">{title}</h1>

            <LiveBadge />

            {user && (
                <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="m-0 text-sm font-semibold text-copy">{user.name}</p>
                        <p className="m-0 text-xs text-copy-light">Clinic admin</p>
                    </div>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content">
                        {initials(user.name)}
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="flex items-center gap-2 rounded-full border border-border bg-transparent p-2 text-sm font-medium text-copy-light hover:border-primary-light hover:text-primary sm:px-3.5"
            >
                <LuLogOut className="size-4" />
                <span className="hidden sm:inline">Log out</span>
            </button>
        </header>
    )
}

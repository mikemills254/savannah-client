import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuLogOut, LuMenu } from 'react-icons/lu'
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
    const [menuOpen, setMenuOpen] = useState(false)
    const menu = useRef<HTMLDivElement>(null)

    // The account menu closes on a click outside it or on Escape
    useEffect(() => {
        if (!menuOpen) return
        const onPointerDown = (event: PointerEvent) => {
            if (!menu.current?.contains(event.target as Node)) setMenuOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [menuOpen])

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

            {user && (
                <div ref={menu} className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label="Account menu"
                        className="group flex cursor-pointer items-center gap-3 rounded-full border border-border/80 bg-white/60 py-1 pr-1.5 pl-3.5 transition-all hover:border-border hover:bg-white hover:shadow-xs focus-visible:outline-2 focus-visible:outline-primary-light"
                    >
                        <span className="hidden text-right sm:block">
                            <span className="block text-sm leading-tight font-semibold text-copy">{user.name}</span>
                            <span className="block text-[11px] leading-tight font-medium text-copy-light">Clinic admin</span>
                        </span>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-xs">
                            {initials(user.name)}
                        </span>
                    </button>

                    {menuOpen && (
                        <div
                            role="menu"
                            className="absolute top-full right-0 z-50 mt-2 w-56 animate-print rounded-2xl border border-border bg-white p-1.5 text-copy shadow-xl motion-reduce:animate-none"
                        >
                            <div className="border-b border-border/60 px-3 py-2.5">
                                <p className="m-0 text-[11px] font-medium tracking-wider text-copy-lighter uppercase">Signed in as</p>
                                <p className="m-0 truncate text-sm font-semibold text-copy">{user.name}</p>
                                <p className="m-0 truncate text-xs text-copy-light">{user.email || 'Clinic admin'}</p>
                            </div>
                            <div className="p-1">
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleLogout}
                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                                >
                                    <LuLogOut className="size-4 shrink-0" />
                                    <span>Log out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </header>
    )
}

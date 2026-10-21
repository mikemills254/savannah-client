import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuLogOut } from 'react-icons/lu'
import { initials } from '../../../lib/initials.ts'
import { useAuthStore } from '../../../store/useAuthStore.ts'
import { Logo } from '../../../website/components/Logo.tsx'

// Top bar and page frame for platform admins
export default function AdminShell({ children }: { children: ReactNode }) {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
                <div className="site-container flex h-16 items-center gap-3">
                    <Link to="/admin" aria-label="All clinics" className="mr-auto">
                        <Logo variant="horizontal" height={32} />
                    </Link>

                    {user && (
                        <span className="hidden text-right sm:block">
                            <span className="block text-sm font-semibold text-copy">{user.name}</span>
                            <span className="block text-xs text-copy-lighter">Platform admin</span>
                        </span>
                    )}
                    {user && (
                        <span
                            className="ml-1 hidden size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-secondary sm:grid"
                            title={`${user.name} · Platform admin`}
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

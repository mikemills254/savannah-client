import { useEffect, useState, type ReactNode } from 'react'
import { LuRefreshCw } from 'react-icons/lu'
import { useAuthStore } from '../../../../store/useAuthStore.ts'
import { useFacilityStore } from '../../store/useFacilityStore.ts'
import Navbar from './navbar.tsx'
import Sidebar from './sidebar.tsx'

interface WrapperProps {
    title?: string
    children: ReactNode
}

// Page frame for every facility page: sidebar, top bar and content area.
// Also loads the facility's data, once per signed-in user.
export default function Wrapper({ title, children }: WrapperProps) {
    const user = useAuthStore((s) => s.user)
    const loadedFor = useFacilityStore((s) => s.loadedFor)
    const status = useFacilityStore((s) => s.status)
    const error = useFacilityStore((s) => s.error)
    const load = useFacilityStore((s) => s.load)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        if (user && loadedFor !== user.id) load(user)
    }, [user, loadedFor, load])

    // Data loaded for an earlier login isn't shown while this one's loads
    const ready = status === 'ready' && loadedFor === user?.id

    return (
        <div className="min-h-screen bg-background">
            <Sidebar user={user} open={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <Navbar user={user} title={title} onMenuClick={() => setMenuOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto w-full max-w-6xl">
                        {ready ? (
                            children
                        ) : status === 'error' ? (
                            <div className="rounded-lg border border-border bg-white px-6 py-14 text-center shadow-sm">
                                <p className="m-0 text-base font-semibold text-copy">We couldn't load your clinic</p>
                                <p className="m-0 mt-1 text-sm text-copy-light">{error}</p>
                                <button
                                    type="button"
                                    onClick={() => user && load(user)}
                                    className="btn btn-primary mt-5"
                                >
                                    <LuRefreshCw className="size-4" />
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
                                <div className="h-14 w-72 animate-pulse rounded-md bg-white" />
                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                    {Array.from({ length: 4 }, (_, i) => (
                                        <div key={i} className="h-28 animate-pulse rounded-md bg-white" />
                                    ))}
                                </div>
                                <div className="h-80 animate-pulse rounded-lg bg-white" />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

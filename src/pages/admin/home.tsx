import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LuBuilding2, LuPlus, LuRefreshCw } from 'react-icons/lu'
import { handleGetFacilities } from '../../api/booking.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { useClock } from '../../hooks/useClock.ts'
import { useCurrentUser } from '../../hooks/useCurrentUser.ts'
import { cn } from '../../lib/cn.ts'
import type { IFacility } from '../../types/auth.types.ts'
import type { IBookableFacility } from '../../types/facility.types.ts'
import Panel from '../facility/components/ui/panel.tsx'
import { dayHeading, formatTime } from '../facility/utils/clinicTime.ts'
import AdminShell from './components/adminShell.tsx'
import ClinicDetail from './components/clinicDetail.tsx'
import ClinicForm from './components/clinicForm.tsx'

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready' }

const byName = (a: IBookableFacility, b: IBookableFacility) => a.name.localeCompare(b.name)

// /admin: the platform admin's console. The selected clinic lives in ?facility=<id>
// so it survives a reload and the back button
export default function AdminHome() {
    const user = useCurrentUser()
    const now = useClock(30_000)
    const [params, setParams] = useSearchParams()
    const selectedId = params.get('facility')

    const [load, setLoad] = useState<Load>({ state: 'loading' })
    const [attempt, setAttempt] = useState(0)
    const [clinics, setClinics] = useState<IBookableFacility[]>([])
    const [adding, setAdding] = useState(false)
    // The clinic created in this visit, which still needs its first admin
    const [createdId, setCreatedId] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        // GET /facilities only lists active clinics, which is every clinic created here
        handleGetFacilities().then((response) => {
            if (cancelled) return
            if (response.success) {
                setClinics(response.data ?? [])
                setLoad({ state: 'ready' })
            } else {
                setLoad({ state: 'error', message: response.message })
            }
        })
        return () => {
            cancelled = true
        }
    }, [attempt])

    const select = (id: string | null) => setParams(id ? { facility: id } : {})

    const created = (facility: IFacility) => {
        setClinics((list) => [...list, { ...facility, next_available: null }].sort(byName))
        setAdding(false)
        setCreatedId(facility.id)
        select(facility.id)
        toast.success(`${facility.name} is live. Now add its first admin.`)
    }

    const selected = clinics.find((clinic) => clinic.id === selectedId) ?? null

    return (
        <AdminShell>
            <div>
                <Eyebrow className="text-primary-light">Platform admin</Eyebrow>
                <h1 className="m-0 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-primary">
                    Clinics on <Accent className="text-primary-light">DocConnect.</Accent>
                </h1>
                <p className="m-0 mt-2 text-copy-light">
                    {load.state !== 'ready'
                        ? `Welcome, ${user.name.split(' ')[0]}. Loading the clinics…`
                        : `${clinics.length} live ${clinics.length === 1 ? 'clinic' : 'clinics'}. Add one, then give it an admin.`}
                </p>
            </div>

            <div className="mt-8">
                {load.state === 'loading' && (
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]" aria-busy="true">
                        <div className="h-96 animate-pulse rounded-lg bg-white" />
                        <div className="h-64 animate-pulse rounded-lg bg-white" />
                    </div>
                )}

                {load.state === 'error' && (
                    <div className="rounded-lg border border-border bg-white px-6 py-12 text-center">
                        <p className="m-0 font-semibold text-copy">We couldn't load the clinics</p>
                        <p className="m-0 mt-1 text-sm text-copy-light">{load.message}</p>
                        <button
                            type="button"
                            onClick={() => {
                                setLoad({ state: 'loading' })
                                setAttempt((n) => n + 1)
                            }}
                            className="btn btn-primary mt-5"
                        >
                            <LuRefreshCw className="size-4" />
                            Try again
                        </button>
                    </div>
                )}

                {load.state === 'ready' && (
                    // minmax(0, …): truncated names mustn't widen the columns past the screen
                    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                        <Panel
                            title="Clinics"
                            action={
                                !adding && (
                                    <button
                                        type="button"
                                        onClick={() => setAdding(true)}
                                        className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                                    >
                                        <LuPlus className="size-4" />
                                        Add clinic
                                    </button>
                                )
                            }
                        >
                            {adding && (
                                <div className="mb-4 rounded-md bg-background p-4">
                                    <ClinicForm onCreated={created} onClose={() => setAdding(false)} />
                                </div>
                            )}

                            {clinics.length === 0 ? (
                                <p className="m-0 py-10 text-center text-sm text-copy-light">
                                    No clinics yet. Add the first one above.
                                </p>
                            ) : (
                                <ul className="m-0 -mx-2 list-none p-0">
                                    {clinics.map((clinic) => {
                                        const active = clinic.id === selectedId
                                        const next = clinic.next_available

                                        return (
                                            <li key={clinic.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => select(clinic.id)}
                                                    aria-current={active ? 'true' : undefined}
                                                    className={cn(
                                                        'flex w-full items-center gap-3 rounded-md border-0 px-2 py-2.5 text-left transition-colors',
                                                        active ? 'bg-accent-bg' : 'bg-transparent hover:bg-background',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'grid size-9 shrink-0 place-items-center rounded-full',
                                                            active ? 'bg-primary text-secondary' : 'bg-background text-copy-light',
                                                        )}
                                                    >
                                                        <LuBuilding2 className="size-4" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span
                                                            className={cn(
                                                                'block truncate text-sm font-semibold',
                                                                active ? 'text-primary' : 'text-copy',
                                                            )}
                                                        >
                                                            {clinic.name}
                                                        </span>
                                                        <span className="block truncate text-xs text-copy-light">
                                                            {next
                                                                ? `Next open ${dayHeading(next.starts_at, now, clinic.timezone)} ${formatTime(next.starts_at, clinic.timezone)}`
                                                                : 'No open slots'}{' '}
                                                            · {clinic.timezone.replace(/_/g, ' ')}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </Panel>

                        {selected ? (
                            <ClinicDetail
                                key={selected.id}
                                clinic={selected}
                                isNew={selected.id === createdId}
                                now={now}
                            />
                        ) : selectedId ? (
                            <div className="rounded-lg border border-border bg-white px-6 py-12 text-center">
                                <p className="m-0 font-semibold text-copy">That clinic isn't listed</p>
                                <p className="m-0 mt-1 text-sm text-copy-light">
                                    It may have been deactivated, or the link is wrong.
                                </p>
                                <button type="button" onClick={() => select(null)} className="btn btn-ghost mt-5">
                                    Back to all clinics
                                </button>
                            </div>
                        ) : (
                            <div className="hidden rounded-lg border-2 border-dashed border-border bg-white/60 px-6 py-16 text-center lg:block">
                                <p className="m-0 text-base font-semibold text-copy">Pick a clinic</p>
                                <p className="m-0 mx-auto mt-1 max-w-sm text-sm text-copy-light">
                                    See its admins and doctors, invite new staff, and check who patients can book.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminShell>
    )
}

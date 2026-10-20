import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LuArrowRight, LuRefreshCw, LuShieldCheck } from 'react-icons/lu'
import { handleCancelAppointment, handleGetMyAppointments } from '../../api/booking.ts'
import { unwrap } from '../../api/request.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { useClock } from '../../hooks/useClock.ts'
import type { IAuthUser } from '../../types/auth.types.ts'
import type { IAppointment } from '../../types/facility.types.ts'
import PatientShell from './patientShell.tsx'
import VisitRow from './visitRow.tsx'
import VisitTicket from './visitTicket.tsx'
import { isUpcoming } from './visitTime.ts'

// How long the CANCELLED stamp shows before the visit moves to history
const STAMP_MS = 1400

function greeting(now: Date): string {
    const hour = now.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready' }

export default function PatientHome({ user }: { user: IAuthUser }) {
    const now = useClock(30_000)
    const [load, setLoad] = useState<Load>({ state: 'loading' })
    const [appointments, setAppointments] = useState<IAppointment[]>([])
    const [stamped, setStamped] = useState<string | null>(null)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        handleGetMyAppointments().then((response) => {
            if (cancelled) return
            if (response.success) {
                setAppointments(response.data ?? [])
                setLoad({ state: 'ready' })
            } else {
                setLoad({ state: 'error', message: response.message })
            }
        })
        return () => {
            cancelled = true
        }
    }, [attempt])

    const cancel = async (id: string, reason: string) => {
        const updated = unwrap(await handleCancelAppointment(id, reason))
        setStamped(id)
        toast.success('Cancelled. The slot is free for someone else now.')
        // Let the stamp land before the visit moves to history
        window.setTimeout(() => {
            setAppointments((list) => list.map((a) => (a.id === id ? updated : a)))
            setStamped(null)
        }, STAMP_MS)
    }

    const upcoming = appointments
        .filter((a) => isUpcoming(a, now) || a.id === stamped)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    const [next, ...later] = upcoming
    const history = appointments
        .filter((a) => !upcoming.includes(a))
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())

    const firstName = user.name.split(' ')[0]

    return (
        <PatientShell>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Eyebrow className="text-primary-light">Your visits</Eyebrow>
                    <h1 className="m-0 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-primary">
                        {greeting(now)}, <Accent className="text-primary-light">{firstName}.</Accent>
                    </h1>
                    <p className="m-0 mt-2 text-copy-light">
                        {load.state !== 'ready'
                            ? 'Checking your bookings…'
                            : upcoming.length === 0
                              ? 'Nothing booked right now.'
                              : `You have ${upcoming.length} upcoming ${upcoming.length === 1 ? 'visit' : 'visits'}.`}
                    </p>
                </div>
                <Link to="/book" className="btn btn-primary self-start sm:self-auto">
                    Book a visit
                    <LuArrowRight className="size-4" />
                </Link>
            </div>

            <div className="mt-8">
                {load.state === 'loading' && (
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-busy="true">
                        <div className="h-96 animate-pulse rounded-lg bg-white" />
                        <div className="h-64 animate-pulse rounded-lg bg-white" />
                    </div>
                )}

                {load.state === 'error' && (
                    <div className="rounded-lg border border-border bg-white px-6 py-12 text-center">
                        <p className="m-0 font-semibold text-copy">We couldn't load your visits</p>
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
                    // minmax(0, …): truncated lines mustn't widen the columns past the screen
                    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                        <div className="flex flex-col gap-8">
                            {next ? (
                                <VisitTicket
                                    key={next.id}
                                    appointment={next}
                                    now={now}
                                    stamped={stamped === next.id}
                                    onCancel={(reason) => cancel(next.id, reason)}
                                />
                            ) : (
                                <div className="rounded-lg border-2 border-dashed border-border bg-white/60 px-6 py-14 text-center">
                                    <p className="m-0 font-mono text-[0.7rem] tracking-[0.16em] text-copy-lighter uppercase">
                                        Admit one · no visit yet
                                    </p>
                                    <p className="m-0 mt-3 text-xl font-bold text-copy">Your next ticket prints here.</p>
                                    <p className="m-0 mx-auto mt-1 max-w-sm text-sm text-copy-light">
                                        Pick a clinic and a doctor, then grab one of their open half-hours.
                                    </p>
                                    <Link to="/book" className="btn btn-accent mt-6">
                                        Find an open slot
                                        <LuArrowRight className="size-4" />
                                    </Link>
                                </div>
                            )}

                            {later.length > 0 && (
                                <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
                                    <h2 className="text-base font-bold">Also coming up</h2>
                                    <ul className="m-0 mt-1 list-none divide-y divide-border p-0">
                                        {later.map((appointment) => (
                                            <VisitRow
                                                key={appointment.id}
                                                appointment={appointment}
                                                now={now}
                                                onCancel={(reason) => cancel(appointment.id, reason)}
                                            />
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>

                        <aside className="flex flex-col gap-6">
                            <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
                                <h2 className="text-base font-bold">History</h2>
                                {history.length === 0 ? (
                                    <p className="m-0 mt-3 text-sm text-copy-light">
                                        Past and cancelled visits will show up here.
                                    </p>
                                ) : (
                                    <ul className="m-0 mt-1 list-none divide-y divide-border p-0">
                                        {history.slice(0, 12).map((appointment) => (
                                            <VisitRow key={appointment.id} appointment={appointment} now={now} />
                                        ))}
                                    </ul>
                                )}
                            </section>

                            <section className="rounded-lg bg-primary p-5 text-white sm:p-6">
                                <p className="m-0 flex items-center gap-2 font-semibold">
                                    <LuShieldCheck className="size-5 text-secondary" />
                                    Your slot is yours
                                </p>
                                <p className="m-0 mt-2 text-sm leading-relaxed text-white/70">
                                    Once you're booked, nobody else can take that time. Can't make it? Cancel here and it
                                    goes straight back up for someone who needs it.
                                </p>
                            </section>
                        </aside>
                    </div>
                )}
            </div>
        </PatientShell>
    )
}

import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LuArrowLeft, LuRefreshCw } from 'react-icons/lu'
import ReschedulePanel from '../../components/booking/reschedulePanel.tsx'
import { useClock } from '../../hooks/useClock.ts'
import { useCurrentUser } from '../../hooks/useCurrentUser.ts'
import { ApiError } from '../../lib/api.ts'
import type { IAppointment } from '../../types/facility.types.ts'
import { formatDate, formatTime } from '../facility/utils/clinicTime.ts'
import PatientShell from './patientShell.tsx'
import { usePatientStore } from './store/usePatientStore.ts'
import VisitTicket from './visitTicket.tsx'
import { staffName } from './visitTime.ts'

interface Fetched {
    id: string
    appointment: IAppointment | null
    error: string | null
    notFound: boolean
}

// /visits/:appointmentId: one visit, past or upcoming, read fresh from the
// server. ?move=1 opens rescheduling. Live updates change it in place.
export default function VisitPage() {
    const { appointmentId = '' } = useParams()
    const [params, setParams] = useSearchParams()
    const user = useCurrentUser()
    const now = useClock(30_000)
    const loadVisits = usePatientStore((s) => s.load)
    const fetchOne = usePatientStore((s) => s.fetchOne)
    const cancelVisit = usePatientStore((s) => s.cancel)
    const reschedule = usePatientStore((s) => s.reschedule)
    // The store's copy is the one live updates change
    const stored = usePatientStore((s) =>
        s.loadedFor === user.id ? s.appointments.find((a) => a.id === appointmentId) : undefined,
    )
    const [fetched, setFetched] = useState<Fetched | null>(null)
    const [attempt, setAttempt] = useState(0)

    // The visit list too, so live updates have a loaded store to land in
    useEffect(() => {
        loadVisits(user.id)
    }, [loadVisits, user.id])

    useEffect(() => {
        const controller = new AbortController()
        fetchOne(appointmentId, controller.signal).then(
            (appointment) => {
                if (!controller.signal.aborted) setFetched({ id: appointmentId, appointment, error: null, notFound: false })
            },
            (error: unknown) => {
                if (controller.signal.aborted) return
                setFetched({
                    id: appointmentId,
                    appointment: null,
                    error: error instanceof Error ? error.message : "Couldn't load this visit",
                    // Not theirs, or no such visit: the API doesn't say which
                    notFound: error instanceof ApiError && error.status === 404,
                })
            },
        )
        return () => controller.abort()
    }, [appointmentId, fetchOne, attempt])

    const current = fetched?.id === appointmentId ? fetched : null
    const visit = stored ?? current?.appointment ?? null
    const moving = params.get('move') === '1'
    const changeable = visit !== null && visit.status === 'BOOKED' && new Date(visit.starts_at) > now

    return (
        <PatientShell>
            <Link
                to="/visits"
                className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
                <LuArrowLeft className="size-4" />
                All visits
            </Link>

            {visit ? (
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div className="flex flex-col gap-6">
                        <VisitTicket
                            appointment={visit}
                            now={now}
                            onCancel={async (reason) => {
                                await cancelVisit(visit.id, reason)
                                toast.success('Cancelled. The slot is free for someone else now.')
                            }}
                        />
                        {moving && changeable && (
                            <ReschedulePanel
                                appointment={visit}
                                onMove={(startsAt) => reschedule(visit.id, startsAt)}
                                onClose={() => setParams({}, { replace: true })}
                            />
                        )}
                    </div>
                    <VisitDetails visit={visit} />
                </div>
            ) : current?.notFound ? (
                <div className="rounded-lg border border-border bg-white px-6 py-14 text-center">
                    <p className="m-0 font-semibold text-copy">We couldn't find that visit</p>
                    <p className="m-0 mt-1 text-sm text-copy-light">It may belong to another account.</p>
                    <Link to="/visits" className="btn btn-primary mt-5">
                        Back to your visits
                    </Link>
                </div>
            ) : current?.error ? (
                <div className="rounded-lg border border-border bg-white px-6 py-14 text-center">
                    <p className="m-0 font-semibold text-copy">We couldn't load this visit</p>
                    <p className="m-0 mt-1 text-sm text-copy-light">{current.error}</p>
                    <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn btn-primary mt-5">
                        <LuRefreshCw className="size-4" />
                        Try again
                    </button>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-busy="true">
                    <div className="h-96 animate-pulse rounded-lg bg-white" />
                    <div className="h-64 animate-pulse rounded-lg bg-white" />
                </div>
            )}
        </PatientShell>
    )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="py-3">
            <dt className="text-xs font-medium text-copy-lighter">{label}</dt>
            <dd className="m-0 mt-1 text-sm text-copy">{children}</dd>
        </div>
    )
}

// The visit's record: who booked it and when, and who cancelled it and why
function VisitDetails({ visit }: { visit: IAppointment }) {
    const tz = visit.facility.timezone
    const stamp = (iso: string) =>
        `${formatDate(new Date(iso), tz, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(iso, tz)}`
    const bookedBy = staffName(visit, visit.booked_by)
    const cancelledBy = staffName(visit, visit.cancelled_by)

    return (
        <section className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold">Visit details</h2>
            <dl className="m-0 mt-1 divide-y divide-border">
                <Row label="Clinic">
                    {visit.facility.name}
                    <span className="block text-xs text-copy-light">Times in {tz.replace(/_/g, ' ')}</span>
                </Row>
                <Row label="Doctor">{visit.doctor.name}</Row>
                <Row label="Booked">
                    {stamp(visit.created_at)}
                    {bookedBy ? ` by ${bookedBy}` : ' by you'}
                </Row>
                {visit.status === 'CANCELLED' && (
                    <Row label="Cancelled">
                        {visit.cancelled_at ? stamp(visit.cancelled_at) : 'Cancelled'}
                        {visit.cancelled_by && (cancelledBy ? ` by ${cancelledBy}` : ' by you')}
                        {visit.cancellation_reason && (
                            <span className="mt-1 block text-copy-light">“{visit.cancellation_reason}”</span>
                        )}
                    </Row>
                )}
            </dl>
        </section>
    )
}

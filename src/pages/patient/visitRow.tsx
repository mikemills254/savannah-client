import { Link } from 'react-router-dom'
import FreshPill from '../../components/live/freshPill.tsx'
import { cn } from '../../lib/cn.ts'
import { useLiveStore } from '../../store/useLiveStore.ts'
import type { IAppointment } from '../../types/facility.types.ts'
import CancelVisitButton from '../facility/components/ui/cancelVisitButton.tsx'
import { formatDate, formatTime, visitWhen } from '../facility/utils/clinicTime.ts'
import { isUpcoming, PATIENT_CANCEL_REASONS, staffName } from './visitTime.ts'

interface VisitRowProps {
    appointment: IAppointment
    now: Date
    onCancel?: (reason: string) => Promise<unknown>
}

// A visit as a tear-off calendar leaf: month and date on the left, details on
// the right. Opens the visit's own page.
export default function VisitRow({ appointment, now, onCancel }: VisitRowProps) {
    // Set when the clinic or doctor just changed it
    const fresh = useLiveStore((s) => s.fresh[appointment.id])
    const tz = appointment.facility.timezone
    const start = new Date(appointment.starts_at)
    const cancelled = appointment.status === 'CANCELLED'
    const upcoming = isUpcoming(appointment, now)
    const cancelledBy = cancelled ? staffName(appointment, appointment.cancelled_by) : null
    const bookedBy = staffName(appointment, appointment.booked_by)

    return (
        <li
            // A new key on each change replays the highlight
            key={fresh ? `${fresh}:${appointment.starts_at}` : 'row'}
            className={cn('flex items-center gap-4 py-3.5', fresh && 'animate-arrive motion-reduce:animate-none')}
        >
            <Link
                to={`/visits/${appointment.id}`}
                className="group flex min-w-0 flex-1 items-center gap-4 text-inherit no-underline"
            >
                <div
                    className={cn(
                        'w-14 shrink-0 overflow-hidden rounded-sm border text-center',
                        cancelled ? 'border-border opacity-60' : 'border-accent-border',
                    )}
                >
                    <p
                        className={cn(
                            'm-0 py-0.5 font-mono text-[0.6rem] font-semibold tracking-[0.14em] uppercase',
                            upcoming ? 'bg-primary text-white' : 'bg-background text-copy-lighter',
                        )}
                    >
                        {formatDate(start, tz, { month: 'short' })}
                    </p>
                    <p className="m-0 bg-white py-1 text-xl leading-none font-extrabold text-copy tabular-nums">
                        {formatDate(start, tz, { day: 'numeric' })}
                    </p>
                    <p className="m-0 bg-white pb-1 text-[0.6rem] font-semibold text-copy-lighter uppercase">
                        {formatDate(start, tz, { weekday: 'short' })}
                    </p>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="m-0 flex items-center gap-2 text-sm font-semibold">
                        <span
                            className={cn(
                                'truncate group-hover:underline',
                                cancelled ? 'text-copy-lighter line-through' : 'text-copy',
                            )}
                        >
                            {appointment.doctor.name}
                            <span className="font-normal text-copy-light">
                                {' · '}
                                {formatTime(appointment.starts_at, tz)}
                            </span>
                        </span>
                        {fresh && <FreshPill type={fresh} />}
                    </p>
                    <p className="m-0 truncate text-xs text-copy-light">
                        {appointment.facility.name}
                        {bookedBy && ` · booked by ${bookedBy}`}
                    </p>
                    {cancelled && (
                        <p
                            className="m-0 mt-0.5 truncate text-xs text-error-ink"
                            title={appointment.cancellation_reason ?? undefined}
                        >
                            {cancelledBy ? `Cancelled by ${cancelledBy}` : 'Cancelled'}
                            {appointment.cancellation_reason && `: ${appointment.cancellation_reason}`}
                        </p>
                    )}
                </div>
            </Link>

            {upcoming && onCancel ? (
                <CancelVisitButton
                    label="Cancel"
                    confirmLabel="Cancel visit"
                    placeholder="Let the clinic know why, e.g. I'm travelling that week"
                    details={`${appointment.doctor.name} · ${visitWhen(appointment.starts_at, tz)} · ${appointment.facility.name}`}
                    reasons={PATIENT_CANCEL_REASONS}
                    onConfirm={onCancel}
                />
            ) : (
                !cancelled && (
                    <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-copy-lighter">
                        Done
                    </span>
                )
            )}
        </li>
    )
}

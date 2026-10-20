import { LuMapPin, LuStethoscope, LuUserCheck } from 'react-icons/lu'
import { barcode } from '../../lib/barcode.ts'
import { cn } from '../../lib/cn.ts'
import { initials } from '../../lib/initials.ts'
import type { IAppointment } from '../../types/facility.types.ts'
import { hashString } from '../auth/utils.ts'
import CancelVisitButton from '../facility/components/ui/cancelVisitButton.tsx'
import { dayHeading, formatDate, formatTime } from '../facility/utils/clinicTime.ts'
import { countdown, staffName, visitCode } from './visitTime.ts'

interface VisitTicketProps {
    appointment: IAppointment
    now: Date
    // Set while the CANCELLED stamp plays, before the visit moves to history
    stamped?: boolean
    onCancel: (reason: string) => Promise<void>
}

// The next visit, as a ticket: the details on top, a tear-off stub below
export default function VisitTicket({ appointment, now, stamped = false, onCancel }: VisitTicketProps) {
    const tz = appointment.facility.timezone
    const code = visitCode(appointment)
    const bars = barcode(hashString(appointment.id), 34)
    const bookedBy = staffName(appointment, appointment.booked_by)
    const started = new Date(appointment.starts_at) <= now
    const soon = new Date(appointment.starts_at).getTime() - now.getTime() < 24 * 60 * 60_000

    return (
        <article className="relative animate-rise drop-shadow-[0_18px_30px_rgba(35,18,64,0.14)] motion-reduce:animate-none">
            <div className="rounded-t-lg px-6 pt-6 pb-7 ticket-top sm:px-8 sm:pt-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 font-mono text-[0.68rem] tracking-[0.14em] text-copy-lighter uppercase">
                    <span className="flex min-w-0 items-center gap-1.5">
                        <LuMapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{appointment.facility.name}</span>
                    </span>
                    <span
                        className={cn(
                            'rounded-full px-2.5 py-1 font-sans text-xs font-bold tracking-normal normal-case',
                            soon ? 'bg-secondary text-secondary-content' : 'bg-accent-bg text-primary',
                        )}
                    >
                        {started ? 'Happening now' : countdown(appointment.starts_at, now)}
                    </span>
                </div>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                    <div>
                        <p className="m-0 text-sm font-semibold text-copy-light">
                            {dayHeading(appointment.starts_at, now, tz)}
                            <span className="font-normal text-copy-lighter">
                                {' · '}
                                {formatDate(new Date(appointment.starts_at), tz, {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                })}
                            </span>
                        </p>
                        <p className="m-0 mt-1 text-[clamp(3rem,10vw,4.5rem)] leading-none font-extrabold tracking-[-0.04em] text-primary tabular-nums">
                            {formatTime(appointment.starts_at, tz)}
                            <span className="ml-2 align-middle text-xl font-semibold tracking-normal text-copy-lighter">
                                –{formatTime(appointment.ends_at, tz)}
                            </span>
                        </p>
                    </div>
                    <p className="m-0 font-mono text-[0.62rem] tracking-[0.14em] text-copy-lighter uppercase">
                        Clinic time · {tz.replace(/_/g, ' ')}
                    </p>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-md bg-background p-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-secondary">
                        {initials(appointment.doctor.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="m-0 truncate font-bold text-copy">{appointment.doctor.name}</p>
                        <p className="m-0 flex items-center gap-1.5 text-xs text-copy-light">
                            <LuStethoscope className="size-3.5" />
                            Consultation · 30 min
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    {bookedBy ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-bg px-3 py-1 text-xs font-semibold text-primary">
                            <LuUserCheck className="size-3.5" />
                            Booked for you by {bookedBy}
                        </span>
                    ) : (
                        <span className="text-xs text-copy-lighter">Arrive a few minutes early.</span>
                    )}
                    {!started && !stamped && (
                        <CancelVisitButton
                            label="Cancel visit"
                            placeholder="Why are you giving this slot up?"
                            confirmLabel="Yes, cancel"
                            onConfirm={onCancel}
                        />
                    )}
                </div>
            </div>

            <div
                className="relative flex items-center justify-between gap-4 rounded-b-lg px-6 pt-[1.15rem] pb-5 text-secondary-content ticket-bottom [--ticket:var(--color-secondary)] before:absolute before:top-0 before:right-4.5 before:left-4.5 before:[border-top:2px_dashed_rgba(28,36,6,0.35)] sm:px-8"
                aria-hidden="true"
            >
                <svg className="block h-8.5 w-40 max-w-[55%]" viewBox={`0 0 ${bars.width} 30`} preserveAspectRatio="none">
                    {bars.bars.map((bar) => (
                        <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={30} fill="currentColor" />
                    ))}
                </svg>
                <div className="text-right font-mono leading-[1.1]">
                    <span className="block text-[0.65rem] tracking-[0.16em] uppercase opacity-70">Visit</span>
                    <strong className="text-[1.35rem] tracking-[0.06em]">{code}</strong>
                </div>
            </div>

            {stamped && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
                    <span className="-rotate-12 animate-stamp rounded-md border-4 border-error bg-white/80 px-5 py-2 font-mono text-3xl font-extrabold tracking-[0.2em] text-error-ink motion-reduce:animate-none sm:text-4xl">
                        CANCELLED
                    </span>
                </div>
            )}
        </article>
    )
}

import { Fragment } from 'react'
import type { IAppointment } from '../../../../types/facility.types.ts'
import FreshPill from '../../../../components/live/freshPill.tsx'
import { cn } from '../../../../lib/cn.ts'
import { useLiveStore } from '../../../../store/useLiveStore.ts'
import { formatTime } from '../../utils/clinicTime.ts'
import { visitState } from '../../utils/schedule.ts'
import Panel from '../ui/panel.tsx'
import VisitBadge from '../ui/visitBadge.tsx'

interface TodayScheduleProps {
    // Today's appointments, in start order
    appointments: IAppointment[]
    now: Date
    timeZone: string
    className?: string
}

export default function TodaySchedule({ appointments, now, timeZone, className }: TodayScheduleProps) {
    // Visits someone changed while the dashboard was open
    const fresh = useLiveStore((s) => s.fresh)
    const booked = appointments.filter((appointment) => appointment.status === 'BOOKED').length
    // The "now" line sits before the first visit that hasn't started yet
    const nowIndex = appointments.findIndex((appointment) => new Date(appointment.starts_at) > now)

    return (
        <Panel
            title="Today's schedule"
            action={<span className="text-sm text-copy-light">{booked} booked</span>}
            className={className}
        >
            {appointments.length === 0 ? (
                <p className="m-0 py-10 text-center text-sm text-copy-light">No appointments booked for today.</p>
            ) : (
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {appointments.map((appointment, index) => {
                        const state = visitState(appointment, now)
                        const change = fresh[appointment.id]

                        return (
                            <Fragment key={appointment.id}>
                                {index === nowIndex && index > 0 && (
                                    <li className="flex items-center gap-2 px-2 py-1">
                                        <span className="text-[11px] font-bold tabular-nums text-error-ink">
                                            {formatTime(now, timeZone)}
                                        </span>
                                        <span className="h-px flex-1 bg-error/50" />
                                    </li>
                                )}

                                <li
                                    // A new key on each change replays the highlight
                                    key={change ? `${change}:${appointment.starts_at}` : 'row'}
                                    className={cn(
                                        'flex items-center gap-3 rounded-sm px-2 py-2.5 sm:gap-4',
                                        state === 'in-progress' && 'bg-secondary-light/30',
                                        state === 'done' && 'opacity-60',
                                        change && 'animate-arrive motion-reduce:animate-none',
                                    )}
                                >
                                    <div className="w-12 shrink-0 tabular-nums">
                                        <p className="m-0 text-sm font-semibold text-copy">
                                            {formatTime(appointment.starts_at, timeZone)}
                                        </p>
                                        <p className="m-0 text-xs text-copy-lighter">
                                            {formatTime(appointment.ends_at, timeZone)}
                                        </p>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={cn(
                                                'm-0 flex items-center gap-2 text-sm font-medium',
                                                state === 'cancelled' ? 'text-copy-lighter line-through' : 'text-copy',
                                            )}
                                        >
                                            <span className="truncate">{appointment.patient.name}</span>
                                            {change && <FreshPill type={change} />}
                                        </p>
                                        <p className="m-0 truncate text-xs text-copy-light">
                                            with {appointment.doctor.name}
                                        </p>
                                    </div>

                                    <VisitBadge state={state} />
                                </li>
                            </Fragment>
                        )
                    })}
                </ul>
            )}
        </Panel>
    )
}

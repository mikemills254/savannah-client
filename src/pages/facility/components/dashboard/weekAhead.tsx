import type { IAppointment } from '../../../../types/facility.types.ts'
import { cn } from '../../../../lib/cn.ts'
import { clinicClock, DAY_MS, formatDate } from '../../utils/clinicTime.ts'
import Panel from '../ui/panel.tsx'

interface WeekAheadProps {
    appointments: IAppointment[]
    now: Date
    timeZone: string
}

export default function WeekAhead({ appointments, now, timeZone }: WeekAheadProps) {
    const perDay = new Map<string, number>()
    for (const appointment of appointments) {
        if (appointment.status !== 'BOOKED') continue
        const day = clinicClock(appointment.starts_at, timeZone).day
        perDay.set(day, (perDay.get(day) ?? 0) + 1)
    }

    const days = Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(now.getTime() + offset * DAY_MS)
        const key = clinicClock(date, timeZone).day
        return { key, label: formatDate(date, timeZone, { weekday: 'short' }), count: perDay.get(key) ?? 0 }
    })

    const busiest = Math.max(1, ...days.map((day) => day.count))
    const total = days.reduce((sum, day) => sum + day.count, 0)

    return (
        <Panel title="Next 7 days" action={<span className="text-sm text-copy-light">{total} booked</span>}>
            <ol className="m-0 grid list-none grid-cols-7 gap-2 p-0">
                {days.map((day, index) => (
                    <li key={day.key} className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-semibold tabular-nums text-copy">{day.count}</span>
                        <div className="flex h-24 w-full items-end rounded-sm bg-background">
                            <div
                                className={cn('w-full rounded-sm', index === 0 ? 'bg-primary' : 'bg-primary-light/40')}
                                style={{ height: `${(day.count / busiest) * 100}%` }}
                            />
                        </div>
                        <span className={cn('text-[11px]', index === 0 ? 'font-bold text-primary' : 'text-copy-light')}>
                            {day.label}
                        </span>
                    </li>
                ))}
            </ol>
        </Panel>
    )
}

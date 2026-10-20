import { cn } from '../../lib/cn.ts'
import type { BookingDay } from './slots.ts'

interface DayStripProps {
    days: BookingDay[]
    selected: string | null
    // Days the doctor has no shifts can't be picked
    isWorking: (day: BookingDay) => boolean
    onSelect: (day: BookingDay) => void
}

// A scrollable row of the next two weeks, like the date tabs on a ticket booth
export default function DayStrip({ days, selected, isWorking, onSelect }: DayStripProps) {
    return (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-2" role="group" aria-label="Pick a day">
            {days.map((day, index) => {
                const working = isWorking(day)
                const active = day.key === selected
                // The month only needs saying where it starts, or on the first day
                const showMonth = index === 0 || day.date === 1

                return (
                    <button
                        key={day.key}
                        type="button"
                        disabled={!working}
                        aria-pressed={active}
                        aria-label={`${day.label} ${day.date} ${day.month}${working ? '' : ', not working'}`}
                        onClick={() => onSelect(day)}
                        className={cn(
                            'group relative flex w-15 shrink-0 flex-col items-center rounded-sm border px-0 pt-1.5 pb-2 transition-[background,border-color,color,translate] duration-200',
                            active
                                ? '-translate-y-0.5 border-primary bg-primary text-white shadow-md'
                                : 'border-border bg-white text-copy enabled:hover:border-primary-light',
                            !working && 'cursor-not-allowed bg-hatch text-copy-lighter',
                        )}
                    >
                        <span
                            className={cn(
                                'font-mono text-[0.6rem] tracking-[0.14em] uppercase',
                                active ? 'text-white/70' : 'text-copy-lighter',
                            )}
                        >
                            {index === 0 ? 'Today' : day.label}
                        </span>
                        <strong className={cn('text-lg leading-tight tabular-nums', !working && 'line-through')}>
                            {day.date}
                        </strong>
                        <span
                            className={cn(
                                'h-3 text-[0.6rem] font-semibold uppercase',
                                active ? 'text-secondary' : 'text-copy-lighter',
                            )}
                        >
                            {showMonth ? day.month : ''}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

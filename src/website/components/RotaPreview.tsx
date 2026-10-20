import { useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { rotaCell, rotaCellBooked, rotaCellOpen, rotaLane, rotaShift } from './sectionStyles.ts'

// --- Illustrative rota: weekly hours become 30-minute slots ---

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DOCTORS = ['Dr. Miller', 'Dr. Otieno', 'Dr. Patel']
const DAY_START = 8
const DAY_HOURS = 10

// [start, end] hour per doctor, per weekday
const SHIFTS: [number, number][][] = [
    [[8, 13], [10, 16], [13, 18]],
    [[9, 14], [8, 12], [12, 17]],
    [[8, 12], [11, 17], [14, 18]],
    [[10, 16], [8, 13], [13, 18]],
    [[8, 13], [12, 18], [9, 14]],
]

const isBooked = (day: number, doc: number, cell: number) => (day * 7 + doc * 5 + cell * 3) % 4 === 0

// Doctor-name column + lane column
const rowCols = 'grid grid-cols-[5.5rem_1fr] items-center gap-2'

const dayBtn =
    'rounded-full border border-border bg-white px-[0.55rem] py-[0.35rem] font-mono text-[0.66rem] tracking-[0.06em] text-copy-light uppercase transition-colors duration-200 ease-[ease] hover:border-primary-light aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-white'

const legendItem = 'inline-flex items-center gap-[0.4rem]'
const swatch = 'size-3 rounded-[3px] border-2 border-primary'

export function RotaPreview() {
    const [day, setDay] = useState(1)

    const shifts = SHIFTS[day]
    const total = shifts.reduce((n, [s, e]) => n + (e - s) * 2, 0)
    const booked = shifts.reduce(
        (n, [s, e], doc) => n + Array.from({ length: (e - s) * 2 }, (_, c) => isBooked(day, doc, c)).filter(Boolean).length,
        0,
    )

    return (
        <div
            className="w-full max-w-135 justify-self-center rounded-lg border border-border bg-white p-5 shadow-lg"
            role="group"
            aria-label="Example clinic rota"
        >
            <div className="mb-[1.1rem] flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border pb-4">
                <div>
                    <strong className="block text-primary">Metro Health Center</strong>
                    <span className="font-mono text-[0.64rem] tracking-widest text-copy-lighter uppercase">
                        Week rota · clinic local time
                    </span>
                </div>
                <div className="flex gap-1">
                    {DAYS.map((d, i) => (
                        <button
                            key={d}
                            type="button"
                            className={dayBtn}
                            aria-pressed={day === i}
                            onClick={() => setDay(i)}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            <div className={rowCols} aria-hidden="true">
                <span />
                <div className="mx-[-0.6rem] mt-0 mb-[0.35rem] flex justify-between font-mono text-[0.58rem] text-copy-lighter">
                    {['08', '10', '12', '14', '16', '18'].map((h) => (
                        <span key={h}>{h}:00</span>
                    ))}
                </div>
            </div>

            {DOCTORS.map((doctor, doc) => {
                const [start, end] = shifts[doc]
                return (
                    <div key={doctor} className={cn(rowCols, 'border-0 border-t border-dashed border-border py-[0.45rem]')}>
                        <span className="truncate text-[0.8rem] font-semibold text-copy">{doctor}</span>
                        <div className={rotaLane}>
                            <div
                                className={rotaShift}
                                style={{
                                    left: `${((start - DAY_START) / DAY_HOURS) * 100}%`,
                                    width: `${((end - start) / DAY_HOURS) * 100}%`,
                                }}
                                aria-label={`${doctor}: ${start}:00 to ${end}:00`}
                            >
                                {Array.from({ length: (end - start) * 2 }, (_, c) => (
                                    <span
                                        key={c}
                                        className={cn(rotaCell, isBooked(day, doc, c) ? rotaCellBooked : rotaCellOpen)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })}

            <div className="mt-[0.9rem] flex flex-wrap items-center gap-x-[1.1rem] gap-y-2 text-[0.75rem] text-copy-light">
                <span className={legendItem}>
                    <i className={cn(swatch, 'bg-primary-light')} /> Open slot
                </span>
                <span className={legendItem}>
                    <i className={cn(swatch, 'bg-secondary')} /> Booked
                </span>
                <span className={cn(legendItem, 'ml-auto font-mono font-semibold text-primary')}>
                    {booked}/{total} booked
                </span>
            </div>
        </div>
    )
}

export default RotaPreview

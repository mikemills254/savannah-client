import { cn } from '../../lib/cn.ts'
import { partOfDay, type SlotCell } from './slots.ts'

interface SlotGridProps {
    cells: SlotCell[]
    // Minutes of the picked slot
    selected: number | null
    loading: boolean
    onSelect: (cell: SlotCell) => void
}

// The doctor's working day as a grid: open times to pick, booked ones hatched
// and struck through, so you can see how busy the day is
export default function SlotGrid({ cells, selected, loading, onSelect }: SlotGridProps) {
    // Times already gone today aren't worth showing
    const shown = cells.filter((cell) => cell.state !== 'past')

    if (loading && shown.length === 0) {
        return (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-busy="true">
                {Array.from({ length: 12 }, (_, i) => (
                    <span key={i} className="h-10 animate-pulse rounded-sm bg-background" />
                ))}
            </div>
        )
    }

    if (shown.length === 0) {
        return (
            <p className="m-0 rounded-sm bg-background px-4 py-6 text-center text-sm text-copy-light">
                No times left this day. Try another one.
            </p>
        )
    }

    const groups: { name: string; cells: SlotCell[] }[] = []
    for (const cell of shown) {
        const name = partOfDay(cell.minutes)
        const last = groups[groups.length - 1]
        if (last?.name === name) last.cells.push(cell)
        else groups.push({ name, cells: [cell] })
    }

    const open = shown.filter((cell) => cell.state === 'open').length

    return (
        <div className={cn('flex flex-col gap-4 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            {groups.map((group) => (
                <div key={group.name}>
                    <p className="m-0 mb-2 font-mono text-[0.62rem] tracking-[0.16em] text-copy-lighter uppercase">
                        {group.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {group.cells.map((cell) => {
                            const taken = cell.state !== 'open'
                            const active = cell.minutes === selected

                            return (
                                <button
                                    key={cell.minutes}
                                    type="button"
                                    disabled={taken}
                                    aria-pressed={active}
                                    aria-label={taken ? `${cell.label}, already booked` : cell.label}
                                    onClick={() => onSelect(cell)}
                                    className={cn(
                                        'rounded-sm border py-2.5 text-sm font-semibold tabular-nums transition-[background,border-color,color,scale] duration-200 enabled:active:scale-95',
                                        active
                                            ? 'border-secondary-dark bg-secondary text-secondary-content shadow-sm'
                                            : 'border-border bg-white text-copy enabled:hover:border-primary enabled:hover:text-primary',
                                        taken && 'cursor-not-allowed bg-hatch text-copy-lighter line-through',
                                    )}
                                >
                                    {cell.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}

            <p className="m-0 text-xs text-copy-lighter">
                {open === 0
                    ? 'Fully booked. Try another day.'
                    : `${open} of ${shown.length} times open. Struck-through times are already booked.`}
            </p>
        </div>
    )
}

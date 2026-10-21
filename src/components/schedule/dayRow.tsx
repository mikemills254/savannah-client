import { useState, type FormEvent } from 'react'
import { LuPlus, LuX } from 'react-icons/lu'
import type { IWorkingHour, IWorkingHourInput } from '../../types/facility.types.ts'
import { cn } from '../../lib/cn.ts'
import { shiftProblem, shiftRange } from '../../pages/facility/utils/schedule.ts'

interface DayRowProps {
    weekday: number
    name: string
    isToday: boolean
    // This day's shifts, in start order
    shifts: IWorkingHour[]
    // Each saves the doctor's whole week and throws with the server's message on failure
    onAdd: (shift: IWorkingHourInput) => Promise<void>
    onRemove: (id: string) => Promise<void>
    // Shifts the doctor already has elsewhere that day, e.g. "St. Jude 09:00–12:00"
    elsewhere?: string[]
}

// One weekday of a doctor's schedule: its shifts, and a form to add one
export default function DayRow({ weekday, name, isToday, shifts, onAdd, onRemove, elsewhere = [] }: DayRowProps) {
    const [adding, setAdding] = useState(false)
    const [start, setStart] = useState('09:00')
    const [end, setEnd] = useState('17:00')
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const closeForm = () => {
        setAdding(false)
        setError(null)
    }

    // The server has the last word on the week
    const save = async (change: () => Promise<void>) => {
        setSaving(true)
        setError(null)
        try {
            await change()
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save the hours")
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const problem = shiftProblem(start, end, shifts)
        if (problem) return setError(problem)
        // Slots run on the half hour, so shifts have to as well
        if (!/:(00|30)$/.test(start) || !/:(00|30)$/.test(end)) {
            return setError('Shifts start and end on the hour or half hour')
        }

        const saved = await save(() => onAdd({ weekday, start_time: `${start}:00`, end_time: `${end}:00` }))
        if (saved) closeForm()
    }

    return (
        <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:gap-6">
            <p className={cn('m-0 w-32 shrink-0 text-sm font-semibold sm:pt-1.5', isToday ? 'text-primary' : 'text-copy')}>
                {name}
                {isToday && <span className="ml-2 text-xs font-medium text-copy-lighter">Today</span>}
            </p>

            <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {shifts.length === 0 && !adding && (
                        <span className="py-1.5 text-sm text-copy-lighter">Not working</span>
                    )}

                    {shifts.map((shift) => (
                        <span
                            key={shift.id}
                            className="inline-flex items-center gap-1 rounded-full border border-accent-border bg-accent-bg py-1 pr-1 pl-3 text-sm font-medium tabular-nums text-primary"
                        >
                            {shiftRange(shift)}
                            <button
                                type="button"
                                onClick={() => save(() => onRemove(shift.id))}
                                disabled={saving}
                                aria-label={`Remove the ${shiftRange(shift)} shift`}
                                className="flex rounded-full border-0 bg-transparent p-1 text-primary/60 hover:bg-white hover:text-error-ink disabled:cursor-progress"
                            >
                                <LuX className="size-3.5" />
                            </button>
                        </span>
                    ))}

                    {!adding && (
                        <button
                            type="button"
                            onClick={() => setAdding(true)}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 text-sm font-medium text-copy-light transition-colors hover:border-primary-light hover:text-primary"
                        >
                            <LuPlus className="size-3.5" />
                            Add shift
                        </button>
                    )}
                </div>

                {elsewhere.length > 0 && (
                    <p className="m-0 text-xs text-copy-lighter">Also working: {elsewhere.join(' · ')}</p>
                )}

                {adding && (
                    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
                        <input
                            type="time"
                            step={1800}
                            aria-label="Shift starts"
                            value={start}
                            onChange={(event) => setStart(event.target.value)}
                            className="form-input w-32"
                        />
                        <span className="text-sm text-copy-lighter">to</span>
                        <input
                            type="time"
                            step={1800}
                            aria-label="Shift ends"
                            value={end}
                            onChange={(event) => setEnd(event.target.value)}
                            className="form-input w-32"
                        />
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary px-4 py-2 text-sm disabled:cursor-progress disabled:opacity-70"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={closeForm} className="btn btn-ghost px-3 py-2 text-sm">
                            Cancel
                        </button>
                    </form>
                )}

                {error && (
                    <p role="alert" className="m-0 text-sm text-error-ink">
                        {error}
                    </p>
                )}
            </div>
        </li>
    )
}

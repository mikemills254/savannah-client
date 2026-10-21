import { useState } from 'react'
import toast from 'react-hot-toast'
import { LuArrowRight, LuX } from 'react-icons/lu'
import { useClock } from '../../hooks/useClock.ts'
import { ApiError } from '../../lib/api.ts'
import { clinicClock, dayHeading, formatTime } from '../../pages/facility/utils/clinicTime.ts'
import type { IAppointment } from '../../types/facility.types.ts'
import DayStrip from './dayStrip.tsx'
import SlotGrid from './slotGrid.tsx'
import { slotCells, slotMinutes, upcomingDays, type SlotCell } from './slots.ts'
import { useAvailability } from './useAvailability.ts'
import { useDoctorDetail } from './useDoctorDetail.ts'

interface ReschedulePanelProps {
    appointment: IAppointment
    // Moves the visit; throws with the server's message
    onMove: (startsAt: string) => Promise<unknown>
    onClose: () => void
}

// Moving a visit to another of the same doctor's free times. Their hours draw
// the days and the grid, as when booking; the old time is freed once it's moved.
export default function ReschedulePanel({ appointment, onMove, onClose }: ReschedulePanelProps) {
    const now = useClock(30_000)
    const tz = appointment.facility.timezone
    // A visit moves within its own clinic: the doctor's hours and free slots there
    const { doctor, loading, error: doctorError } = useDoctorDetail(appointment.doctor.id, appointment.facility.id)

    const [dayKey, setDayKey] = useState<string | null>(null)
    const [cell, setCell] = useState<SlotCell | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hours = doctor?.working_hours ?? []
    const days = upcomingDays(now, tz)
    const isWorking = (weekday: number) => slotMinutes(hours, weekday).length > 0
    const currentDay = dayHeading(appointment.starts_at, now, tz)
    // The picked day, else the visit's own day, else the first day they work
    const day =
        days.find((d) => d.key === dayKey && isWorking(d.weekday)) ??
        days.find((d) => d.key === clinicClock(appointment.starts_at, tz).day && isWorking(d.weekday)) ??
        days.find((d) => isWorking(d.weekday))
    const availability = useAvailability(doctor ? doctor.id : null, day?.key ?? null, appointment.facility.id)
    const cells = day ? slotCells(slotMinutes(hours, day.weekday), availability.slots, day.key, now, tz) : []
    const picked = cell && cell.slot && day?.key === dayKey ? cell : null

    const move = async () => {
        if (!picked?.slot) return
        setBusy(true)
        setError(null)
        try {
            await onMove(picked.slot.starts_at)
            toast.success(`Moved to ${dayHeading(picked.slot.starts_at, now, tz)} at ${picked.label}`)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't move the visit")
            // Someone took it first: show what's still free
            if (err instanceof ApiError && err.status === 409) {
                setCell(null)
                availability.reload()
            }
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="min-w-0 animate-print rounded-md border border-accent-border bg-accent-bg/40 p-4 motion-reduce:animate-none sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="m-0 text-sm font-bold text-copy">Move this visit</p>
                    <p className="m-0 mt-0.5 text-xs text-copy-light">
                        Now {currentDay} at {formatTime(appointment.starts_at, tz)} with {appointment.doctor.name}.
                        Pick a new time; this one is freed once you move.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="shrink-0 rounded-full border-0 bg-transparent p-1 text-copy-light hover:bg-white hover:text-copy"
                >
                    <LuX className="size-4" />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3" aria-busy="true">
                    <div className="h-20 animate-pulse rounded-sm bg-white" />
                    <div className="h-32 animate-pulse rounded-sm bg-white" />
                </div>
            ) : doctorError || !doctor ? (
                <p role="alert" className="m-0 rounded-sm bg-white px-4 py-5 text-center text-sm text-copy-light">
                    {appointment.doctor.name} isn't taking bookings any more, so this visit can't be moved. Cancel it
                    and book with someone else.
                </p>
            ) : !day ? (
                <p className="m-0 rounded-sm bg-white px-4 py-5 text-center text-sm text-copy-light">
                    {appointment.doctor.name} has no working hours in the next two weeks.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    <DayStrip
                        days={days}
                        selected={day.key}
                        isWorking={(d) => isWorking(d.weekday)}
                        onSelect={(d) => {
                            setDayKey(d.key)
                            setCell(null)
                            setError(null)
                        }}
                    />
                    {availability.error ? (
                        <p role="alert" className="m-0 text-sm text-error-ink">
                            {availability.error}
                        </p>
                    ) : (
                        <SlotGrid
                            cells={cells}
                            selected={picked?.minutes ?? null}
                            loading={availability.loading}
                            onSelect={(c) => {
                                setDayKey(day.key)
                                setCell(c)
                                setError(null)
                            }}
                        />
                    )}

                    {error && (
                        <p role="alert" className="m-0 text-sm text-error-ink">
                            {error}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={move}
                            disabled={!picked || busy}
                            className="btn btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {busy
                                ? 'Moving…'
                                : picked?.slot
                                  ? `Move to ${dayHeading(picked.slot.starts_at, now, tz)}, ${picked.label}`
                                  : 'Pick a new time'}
                            {!busy && picked && <LuArrowRight className="size-4" />}
                        </button>
                        <button type="button" onClick={onClose} className="btn btn-ghost px-4 py-2 text-sm">
                            Keep current time
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

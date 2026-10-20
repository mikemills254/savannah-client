import { useEffect, useState, type FormEvent } from 'react'
import { LuCheck, LuSearch, LuUserPlus, LuX } from 'react-icons/lu'
import { handleSearchPatients } from '../../../../api/facility.ts'
import { ApiError } from '../../../../lib/api.ts'
import { cn } from '../../../../lib/cn.ts'
import type { IAppointmentBooked, IMember, IPatient } from '../../../../types/facility.types.ts'
import DayStrip from '../../../../components/booking/dayStrip.tsx'
import SlotGrid from '../../../../components/booking/slotGrid.tsx'
import { slotCells, slotMinutes, upcomingDays, type SlotCell } from '../../../../components/booking/slots.ts'
import { useAvailability } from '../../../../components/booking/useAvailability.ts'
import InviteLink from '../../../../components/inviteLink.tsx'
import { useClinicNow } from '../../hooks/useClinicNow.ts'
import { useFacilityStore } from '../../store/useFacilityStore.ts'
import { dayHeading, formatTime } from '../../utils/clinicTime.ts'
import Avatar from '../ui/avatar.tsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface BookForPatientProps {
    // The facility's doctors; deactivated ones and those without hours can't be booked
    doctors: IMember[]
    onClose: () => void
}

const stepLabel = 'm-0 mb-3 flex items-center gap-2 font-mono text-[0.68rem] font-semibold tracking-[0.14em] text-copy-lighter uppercase'
const stepNumber = 'grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] text-white'

export default function BookForPatient({ doctors, onClose }: BookForPatientProps) {
    const facilityId = useFacilityStore((s) => s.facilityId)
    const workingHours = useFacilityStore((s) => s.workingHours)
    const bookForPatient = useFacilityStore((s) => s.bookForPatient)
    const { now, timeZone } = useClinicNow()

    // --- Who ---
    const [mode, setMode] = useState<'search' | 'new'>('search')
    const [query, setQuery] = useState('')
    const [found, setFound] = useState<{ query: string; patients: IPatient[] } | null>(null)
    const [picked, setPicked] = useState<IPatient | null>(null)
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')

    // --- When ---
    const bookable = doctors.filter(
        (doctor) => doctor.is_active && workingHours.some((hour) => hour.doctor_id === doctor.id),
    )
    const [doctorId, setDoctorId] = useState(bookable[0]?.id ?? '')
    const [dayKey, setDayKey] = useState<string | null>(null)
    const [cell, setCell] = useState<SlotCell | null>(null)
    // One per chosen slot, so a retry of the same booking can't book twice
    const [idempotencyKey, setIdempotencyKey] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [booked, setBooked] = useState<IAppointmentBooked | null>(null)

    const search = query.trim()

    useEffect(() => {
        if (mode !== 'search' || search.length < 2 || !facilityId) return
        const controller = new AbortController()
        // Waits for a pause in typing before asking the server
        const timer = window.setTimeout(() => {
            handleSearchPatients(facilityId, search, controller.signal).then((response) => {
                if (!controller.signal.aborted && response.success) {
                    setFound({ query: search, patients: response.data ?? [] })
                }
            })
        }, 250)
        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [mode, search, facilityId])

    const hours = workingHours.filter((hour) => hour.doctor_id === doctorId)
    const days = upcomingDays(now, timeZone)
    const isWorking = (weekday: number) => slotMinutes(hours, weekday).length > 0
    const day = days.find((d) => d.key === dayKey && isWorking(d.weekday)) ?? days.find((d) => isWorking(d.weekday))
    const availability = useAvailability(doctorId || null, day?.key ?? null)
    const cells = day ? slotCells(slotMinutes(hours, day.weekday), availability.slots, day.key, now, timeZone) : []
    // A pick that has since been taken isn't a pick any more
    const chosen = cell && cells.find((c) => c.minutes === cell.minutes && c.state === 'open') ? cell : null

    const resetSlot = () => {
        setCell(null)
        setError(null)
    }

    const pickSlot = (next: SlotCell) => {
        setCell(next)
        setIdempotencyKey(crypto.randomUUID())
        setError(null)
    }

    const patientPayload = (): { email: string; name?: string } | string => {
        if (mode === 'search') {
            return picked ? { email: picked.email } : 'Pick a patient, or add a new one'
        }
        if (!newName.trim()) return "Enter the patient's name"
        if (!EMAIL_PATTERN.test(newEmail.trim())) return 'Enter a valid email address'
        return { email: newEmail.trim().toLowerCase(), name: newName.trim() }
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const patient = patientPayload()
        if (typeof patient === 'string') return setError(patient)
        if (!chosen?.slot) return setError('Pick a time')

        setSubmitting(true)
        setError(null)
        try {
            setBooked(
                await bookForPatient(
                    { doctor_id: doctorId, starts_at: chosen.slot.starts_at, patient },
                    idempotencyKey,
                ),
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Booking failed')
            // Someone else got the slot: show the day as it is now
            if (err instanceof ApiError && err.status === 409) availability.reload()
        } finally {
            setSubmitting(false)
        }
    }

    if (booked) {
        const { appointment, invite_token } = booked
        return (
            <div className="flex flex-col gap-4">
                <div className="flex animate-pop items-center gap-3 rounded-md bg-secondary p-4 text-secondary-content motion-reduce:animate-none">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary-content text-secondary">
                        <LuCheck className="size-5" strokeWidth={3} />
                    </span>
                    <div>
                        <p className="m-0 font-bold">{appointment.patient.name} is booked</p>
                        <p className="m-0 text-sm">
                            {appointment.doctor.name} · {dayHeading(appointment.starts_at, now, timeZone)},{' '}
                            {formatTime(appointment.starts_at, timeZone)}
                        </p>
                    </div>
                </div>

                {invite_token && <InviteLink token={invite_token} name={appointment.patient.name} />}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setBooked(null)
                            setPicked(null)
                            setNewName('')
                            setNewEmail('')
                            setQuery('')
                            resetSlot()
                        }}
                        className="btn btn-secondary"
                    >
                        Book another
                    </button>
                    <button type="button" onClick={onClose} className="btn btn-ghost">
                        Done
                    </button>
                </div>
            </div>
        )
    }

    if (bookable.length === 0) {
        return (
            <p className="m-0 rounded-sm bg-warning/15 px-4 py-3 text-sm text-warning-content">
                No doctor has working hours yet, so there's nothing to book. Add hours first.
            </p>
        )
    }

    const results = found?.query === search ? found.patients : []

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
            {/* 1. Who */}
            <section>
                <p className={stepLabel}>
                    <span className={stepNumber}>1</span>
                    Patient
                </p>

                {mode === 'search' && picked ? (
                    <div className="flex items-center gap-3 rounded-md border border-accent-border bg-accent-bg p-3">
                        <Avatar name={picked.name} />
                        <div className="min-w-0 flex-1">
                            <p className="m-0 truncate text-sm font-semibold text-copy">{picked.name}</p>
                            <p className="m-0 truncate text-xs text-copy-light">{picked.email}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPicked(null)}
                            aria-label="Choose someone else"
                            className="rounded-full border-0 bg-transparent p-1.5 text-copy-light hover:bg-white hover:text-copy"
                        >
                            <LuX className="size-4" />
                        </button>
                    </div>
                ) : mode === 'search' ? (
                    <div>
                        <div className="relative">
                            <LuSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-copy-lighter" />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search patients who've booked here, by name or email"
                                aria-label="Search patients"
                                className="form-input pl-10"
                                autoComplete="off"
                            />
                        </div>
                        {search.length >= 2 && (
                            <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                                {results.map((patient) => (
                                    <li key={patient.id}>
                                        <button
                                            type="button"
                                            onClick={() => setPicked(patient)}
                                            className="flex w-full items-center gap-3 rounded-sm border-0 bg-transparent px-2 py-2 text-left hover:bg-background"
                                        >
                                            <Avatar name={patient.name} />
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium text-copy">
                                                    {patient.name}
                                                </span>
                                                <span className="block truncate text-xs text-copy-light">
                                                    {patient.email}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                                {found?.query === search && results.length === 0 && (
                                    <li className="px-2 py-2 text-sm text-copy-light">
                                        Nobody here matches “{search}”.
                                    </li>
                                )}
                            </ul>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setMode('new')
                                // An email typed into the search is probably theirs
                                if (search.includes('@')) setNewEmail(search)
                                else if (search) setNewName(search)
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                        >
                            <LuUserPlus className="size-4" />
                            New patient
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-copy">
                                Full name
                                <input
                                    className="form-input"
                                    value={newName}
                                    onChange={(event) => setNewName(event.target.value)}
                                    autoComplete="off"
                                />
                            </label>
                            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-copy">
                                Email
                                <input
                                    type="email"
                                    className="form-input"
                                    value={newEmail}
                                    onChange={(event) => setNewEmail(event.target.value)}
                                    autoComplete="off"
                                />
                            </label>
                        </div>
                        <p className="m-0 mt-2 text-xs text-copy-lighter">
                            If they already have a DocConnect account, the booking goes on it. Otherwise one is made
                            and you get a link to send them.
                        </p>
                        <button
                            type="button"
                            onClick={() => setMode('search')}
                            className="mt-3 border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                        >
                            Search returning patients instead
                        </button>
                    </div>
                )}
            </section>

            {/* 2. When */}
            <section>
                <p className={stepLabel}>
                    <span className={stepNumber}>2</span>
                    Doctor and time
                </p>

                {bookable.length > 1 && (
                    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Doctor">
                        {bookable.map((doctor) => (
                            <button
                                key={doctor.id}
                                type="button"
                                aria-pressed={doctor.id === doctorId}
                                onClick={() => {
                                    setDoctorId(doctor.id)
                                    resetSlot()
                                }}
                                className={cn(
                                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                                    doctor.id === doctorId
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-border bg-white text-copy hover:border-primary-light',
                                )}
                            >
                                {doctor.name}
                            </button>
                        ))}
                    </div>
                )}

                <DayStrip
                    days={days}
                    selected={day?.key ?? null}
                    isWorking={(d) => isWorking(d.weekday)}
                    onSelect={(d) => {
                        setDayKey(d.key)
                        resetSlot()
                    }}
                />

                <div className="mt-3">
                    {availability.error ? (
                        <p className="m-0 text-sm text-error-ink">{availability.error}</p>
                    ) : (
                        <SlotGrid
                            cells={cells}
                            selected={chosen?.minutes ?? null}
                            loading={availability.loading}
                            onSelect={pickSlot}
                        />
                    )}
                </div>
            </section>

            {error && (
                <p role="alert" className="m-0 animate-shake rounded-sm bg-error/8 px-3.5 py-3 text-sm text-error-ink motion-reduce:animate-none">
                    {error}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <button type="submit" disabled={submitting} className="btn btn-primary disabled:cursor-progress disabled:opacity-70">
                    {submitting
                        ? 'Booking…'
                        : chosen && day
                          ? `Book ${day.key === days[0].key ? 'today' : `${day.label} ${day.date} ${day.month}`} at ${chosen.label}`
                          : 'Book'}
                </button>
                <button type="button" onClick={onClose} className="btn btn-ghost">
                    Cancel
                </button>
            </div>
        </form>
    )
}


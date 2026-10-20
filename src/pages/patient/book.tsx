import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuArrowRight, LuCheck, LuClock, LuMapPin, LuRotateCcw } from 'react-icons/lu'
import {
    handleBookAppointment,
    handleGetDoctor,
    handleGetFacilities,
    handleGetFacilityDoctors,
} from '../../api/booking.ts'
import DayStrip from '../../components/booking/dayStrip.tsx'
import SlotGrid from '../../components/booking/slotGrid.tsx'
import { slotCells, slotMinutes, upcomingDays, type SlotCell } from '../../components/booking/slots.ts'
import { useAvailability } from '../../components/booking/useAvailability.ts'
import { Accent, Eyebrow, LiveBadge } from '../../components/ui.tsx'
import { useClock } from '../../hooks/useClock.ts'
import { cn } from '../../lib/cn.ts'
import { initials } from '../../lib/initials.ts'
import type { IFacility } from '../../types/auth.types.ts'
import type { IAppointment, IDoctorDetail } from '../../types/facility.types.ts'
import { formatDuration, formatTime } from '../facility/utils/clinicTime.ts'
import { WEEKDAY_NAMES, weeklyMinutes } from '../facility/utils/schedule.ts'
import PatientShell from './patientShell.tsx'

type Outcome =
    | { kind: 'idle' }
    | { kind: 'booking' }
    | { kind: 'booked'; appointment: IAppointment }
    // 409: the slot went, or the patient already has a visit then
    | { kind: 'conflict'; minutes: number; label: string; message: string }
    | { kind: 'error'; message: string }

interface Pick {
    // doctor|day the pick belongs to
    key: string
    cell: SlotCell
    // One per picked slot, reused if the same booking is retried
    idempotencyKey: string
}

export default function BookVisit() {
    const now = useClock(30_000)
    const [params, setParams] = useSearchParams()

    // --- Clinics ---
    const [facilities, setFacilities] = useState<IFacility[] | null>(null)
    const [facilitiesError, setFacilitiesError] = useState<string | null>(null)
    const [changingClinic, setChangingClinic] = useState(false)

    useEffect(() => {
        let cancelled = false
        handleGetFacilities().then((response) => {
            if (cancelled) return
            if (response.success) setFacilities((response.data ?? []).filter((f) => f.is_active))
            else setFacilitiesError(response.message)
        })
        return () => {
            cancelled = true
        }
    }, [])

    const facility = facilities?.find((f) => f.id === params.get('facility')) ?? null
    const facilityId = facility?.id ?? null
    const tz = facility?.timezone ?? 'UTC'

    // --- Doctors, with their weekly hours ---
    const [team, setTeam] = useState<{ facilityId: string; doctors: IDoctorDetail[] } | null>(null)

    useEffect(() => {
        if (!facilityId) return
        let cancelled = false
        handleGetFacilityDoctors(facilityId).then(async (response) => {
            const details = await Promise.all((response.data ?? []).map((doctor) => handleGetDoctor(doctor.id)))
            if (cancelled) return
            setTeam({
                facilityId,
                doctors: details.flatMap((detail) => (detail.success && detail.data ? [detail.data] : [])),
            })
        })
        return () => {
            cancelled = true
        }
    }, [facilityId])

    const doctors = team && team.facilityId === facilityId ? team.doctors : null
    const doctor = doctors?.find((d) => d.id === params.get('doctor')) ?? null

    // --- Day and time ---
    const days = upcomingDays(now, tz)
    const hours = doctor?.working_hours ?? []
    const isWorking = (weekday: number) => slotMinutes(hours, weekday).length > 0
    const day = doctor
        ? (days.find((d) => d.key === params.get('date') && isWorking(d.weekday)) ??
          days.find((d) => isWorking(d.weekday)) ??
          null)
        : null
    const availability = useAvailability(doctor?.id ?? null, day?.key ?? null)
    const cells = day ? slotCells(slotMinutes(hours, day.weekday), availability.slots, day.key, now, tz) : []

    const [pick, setPick] = useState<Pick | null>(null)
    const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })
    const pickKey = doctor && day ? `${doctor.id}|${day.key}` : null
    const chosen =
        pick && pick.key === pickKey && cells.some((c) => c.minutes === pick.cell.minutes && c.state === 'open')
            ? pick
            : null

    const choose = (changes: Record<string, string | null>) => {
        const next = new URLSearchParams(params)
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
        }
        setParams(next, { replace: true })
        setPick(null)
        setOutcome({ kind: 'idle' })
    }

    const pickSlot = (cell: SlotCell) => {
        if (!pickKey) return
        setPick({ key: pickKey, cell, idempotencyKey: crypto.randomUUID() })
        setOutcome({ kind: 'idle' })
    }

    const book = async () => {
        if (!chosen?.cell.slot || !doctor) return
        setOutcome({ kind: 'booking' })
        const response = await handleBookAppointment(
            { doctor_id: doctor.id, starts_at: chosen.cell.slot.starts_at },
            chosen.idempotencyKey,
        )
        if (response.success && response.data) {
            setOutcome({ kind: 'booked', appointment: response.data })
            availability.reload()
        } else if (response.status === 409) {
            setOutcome({
                kind: 'conflict',
                minutes: chosen.cell.minutes,
                label: chosen.cell.label,
                message: response.message,
            })
            // See the day as it is now
            availability.reload()
        } else {
            setOutcome({ kind: 'error', message: response.message })
        }
    }

    const startOver = () => {
        setPick(null)
        setOutcome({ kind: 'idle' })
    }

    // From the bar on small screens: the outcome shows on the ticket further down
    const bookFromBar = async () => {
        await book()
        document.getElementById('visit-ticket')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const dayLabel =
        day && doctor ? (day.key === days[0].key ? 'Today' : `${day.label} ${day.date} ${day.month}`) : null

    return (
        <PatientShell>
            <div className="max-w-2xl">
                <Eyebrow className="text-primary-light">Book a visit</Eyebrow>
                <h1 className="m-0 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-primary">
                    Find your <Accent className="text-primary-light">half hour.</Accent>
                </h1>
                <p className="m-0 mt-2 text-copy-light">
                    Every time you see comes from the doctor's real working hours, in the clinic's own time.
                </p>
            </div>

            {/* minmax(0, …): the scrolling day strip mustn't widen the columns past the screen */}
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-8 pb-24 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:pb-0">
                <div className="flex flex-col gap-6">
                    {/* 1. Where */}
                    <Step number={1} title="Where?" done={!!facility}>
                        {facilitiesError ? (
                            <p className="m-0 text-sm text-error-ink">{facilitiesError}</p>
                        ) : !facilities ? (
                            <div className="h-40 animate-pulse rounded-md bg-ink/80" />
                        ) : facility && !changingClinic ? (
                            <div className="flex items-center gap-3 rounded-md border border-accent-border bg-accent-bg p-3.5">
                                <LuMapPin className="size-5 shrink-0 text-primary" />
                                <div className="min-w-0 flex-1">
                                    <p className="m-0 truncate font-semibold text-copy">{facility.name}</p>
                                    <p className="m-0 font-mono text-[0.68rem] tracking-[0.08em] text-copy-light">
                                        {facility.timezone.replace(/_/g, ' ')} · {formatTime(now, facility.timezone)} there now
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setChangingClinic(true)}
                                    className="border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                                >
                                    Change
                                </button>
                            </div>
                        ) : facilities.length === 0 ? (
                            <p className="m-0 text-sm text-copy-light">No clinics are taking bookings yet.</p>
                        ) : (
                            <ClinicBoard
                                facilities={facilities}
                                now={now}
                                selected={facilityId}
                                onSelect={(id) => {
                                    setChangingClinic(false)
                                    choose({ facility: id, doctor: null, date: null })
                                }}
                            />
                        )}
                    </Step>

                    {/* 2. Who */}
                    {facility && !changingClinic && (
                        <Step number={2} title="Who would you like to see?" done={!!doctor}>
                            {!doctors ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="h-28 animate-pulse rounded-md bg-white" />
                                    <div className="h-28 animate-pulse rounded-md bg-white" />
                                </div>
                            ) : doctors.length === 0 ? (
                                <p className="m-0 text-sm text-copy-light">
                                    {facility.name} has no doctors taking bookings right now.
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {doctors.map((d) => (
                                        <DoctorCard
                                            key={d.id}
                                            doctor={d}
                                            selected={d.id === doctor?.id}
                                            onSelect={() => choose({ doctor: d.id, date: null })}
                                        />
                                    ))}
                                </div>
                            )}
                        </Step>
                    )}

                    {/* 3. When */}
                    {doctor && !changingClinic && (
                        <Step number={3} title="When?" done={!!chosen}>
                            {!day ? (
                                <p className="m-0 text-sm text-copy-light">
                                    {doctor.name} has no working days in the next two weeks.
                                </p>
                            ) : (
                                <>
                                    <DayStrip
                                        days={days}
                                        selected={day.key}
                                        isWorking={(d) => isWorking(d.weekday)}
                                        onSelect={(d) => choose({ date: d.key })}
                                    />
                                    <div className="mt-4">
                                        {availability.error ? (
                                            <p className="m-0 text-sm text-error-ink">{availability.error}</p>
                                        ) : (
                                            <SlotGrid
                                                cells={cells}
                                                selected={chosen?.cell.minutes ?? null}
                                                loading={availability.loading}
                                                onSelect={pickSlot}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </Step>
                    )}
                </div>

                <TicketPreview
                    facility={changingClinic ? null : facility}
                    doctor={changingClinic ? null : doctor}
                    dayLabel={dayLabel}
                    time={chosen ? `${chosen.cell.label}–${formatTime(chosen.cell.slot?.ends_at ?? now, tz)}` : null}
                    outcome={outcome}
                    nextOpen={
                        outcome.kind === 'conflict' && !availability.loading
                            ? nearestOpen(cells, outcome.minutes)
                            : []
                    }
                    conflictStillOpen={
                        outcome.kind === 'conflict' &&
                        cells.some((c) => c.minutes === outcome.minutes && c.state === 'open')
                    }
                    checking={outcome.kind === 'conflict' && availability.loading}
                    onBook={book}
                    onPick={pickSlot}
                    onStartOver={startOver}
                    tz={tz}
                    now={now}
                />
            </div>

            {/* On small screens the ticket sits below the slots, so the Book button follows you */}
            {chosen && doctor && outcome.kind !== 'booked' && (
                <div className="fixed inset-x-0 bottom-0 z-30 animate-rise border-t border-border bg-white/95 py-3 backdrop-blur motion-reduce:animate-none lg:hidden">
                    <div className="site-container flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="m-0 truncate font-mono text-[0.62rem] tracking-[0.12em] text-copy-lighter uppercase">
                                {doctor.name}
                            </p>
                            <p className="m-0 truncate font-bold text-copy">
                                {dayLabel} · {chosen.cell.label}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={bookFromBar}
                            disabled={outcome.kind === 'booking'}
                            className="btn btn-primary shrink-0 disabled:cursor-progress disabled:opacity-70"
                        >
                            {outcome.kind === 'booking' ? 'Booking…' : `Book ${chosen.cell.label}`}
                        </button>
                    </div>
                </div>
            )}
        </PatientShell>
    )
}

// The three open times closest to the one that was taken
function nearestOpen(cells: SlotCell[], minutes: number): SlotCell[] {
    return cells
        .filter((c) => c.state === 'open')
        .sort((a, b) => Math.abs(a.minutes - minutes) - Math.abs(b.minutes - minutes))
        .slice(0, 3)
        .sort((a, b) => a.minutes - b.minutes)
}

function Step({ number, title, done, children }: { number: number; title: string; done: boolean; children: ReactNode }) {
    return (
        <section className="animate-rise rounded-lg border border-border bg-white p-5 shadow-sm motion-reduce:animate-none sm:p-6">
            <h2 className="mb-4 flex items-center gap-3 text-base font-bold">
                <span
                    className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
                        done ? 'bg-secondary text-secondary-content' : 'bg-primary text-white',
                    )}
                >
                    {done ? <LuCheck className="size-4" strokeWidth={3} /> : number}
                </span>
                {title}
            </h2>
            {children}
        </section>
    )
}

interface ClinicBoardProps {
    facilities: IFacility[]
    now: Date
    selected: string | null
    onSelect: (id: string) => void
}

// Past this many clinics the board gets a search box
const SEARCH_FROM = 6

// The clinics as a departure board, each with the time there now
function ClinicBoard({ facilities, now, selected, onSelect }: ClinicBoardProps) {
    const [query, setQuery] = useState('')
    const search = query.trim().toLowerCase()
    const shown = facilities.filter((facility) => !search || facility.name.toLowerCase().includes(search))

    return (
        <div className="rounded-md border border-white/8 bg-ink px-2 py-1 shadow-board" role="list">
            {facilities.length > SEARCH_FROM && (
                <div className="border-b border-white/12 px-1 pt-2 pb-3">
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search clinics"
                        aria-label="Search clinics"
                        className="w-full rounded-sm border border-white/15 bg-white/5 px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/40 focus:border-secondary focus:outline-none"
                    />
                </div>
            )}
            {shown.length === 0 && (
                <p className="m-0 px-3 py-6 text-center font-mono text-sm text-white/50">No clinic matches “{query.trim()}”.</p>
            )}
            {shown.map((facility, index) => (
                <button
                    key={facility.id}
                    type="button"
                    role="listitem"
                    onClick={() => onSelect(facility.id)}
                    className={cn(
                        'grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-0 border-b border-dashed border-white/10 bg-transparent px-3 py-4 text-left transition-colors last:border-b-0 hover:bg-white/5',
                        facility.id === selected && 'bg-white/8',
                    )}
                >
                    <span className="font-mono text-[0.8rem] text-white/35">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                        <span className="block truncate font-bold text-white">{facility.name}</span>
                        <span className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[0.68rem] text-secondary before:size-1.5 before:animate-breathe before:rounded-full before:bg-secondary motion-reduce:before:animate-none">
                            Taking bookings · {facility.timezone.replace(/_/g, ' ')}
                        </span>
                    </span>
                    <span className="font-mono text-lg text-secondary tabular-nums [text-shadow:0_0_12px_rgba(186,218,85,0.45)]">
                        {formatTime(now, facility.timezone)}
                    </span>
                </button>
            ))}
        </div>
    )
}

interface DoctorCardProps {
    doctor: IDoctorDetail
    selected: boolean
    onSelect: () => void
}

function DoctorCard({ doctor, selected, onSelect }: DoctorCardProps) {
    const weekly = weeklyMinutes(doctor.working_hours)
    const workDays = new Set(doctor.working_hours.map((hour) => hour.weekday))

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={weekly === 0}
            aria-pressed={selected}
            className={cn(
                'flex flex-col gap-3 rounded-md border bg-white p-4 text-left transition-[border-color,box-shadow,translate] duration-200',
                selected
                    ? 'border-primary shadow-md ring-2 ring-primary/15'
                    : 'border-border enabled:hover:-translate-y-0.5 enabled:hover:border-primary-light enabled:hover:shadow-sm',
                weekly === 0 && 'cursor-not-allowed opacity-60',
            )}
        >
            <span className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-secondary">
                    {initials(doctor.name)}
                </span>
                <span className="min-w-0">
                    <span className="block truncate font-bold text-copy">{doctor.name}</span>
                    <span className="flex items-center gap-1 text-xs text-copy-light">
                        <LuClock className="size-3.5" />
                        {weekly > 0 ? `${formatDuration(weekly)} a week` : 'No hours yet'}
                    </span>
                </span>
            </span>

            {/* Which days of the week they work */}
            <span className="flex gap-1" aria-label={`Works ${WEEKDAY_NAMES.filter((_, i) => workDays.has(i)).join(', ')}`}>
                {WEEKDAY_NAMES.map((name, weekday) => (
                    <span
                        key={name}
                        className={cn(
                            'grid h-6 flex-1 place-items-center rounded-[6px] text-[0.62rem] font-bold',
                            workDays.has(weekday) ? 'bg-primary text-secondary' : 'bg-background text-copy-lighter',
                        )}
                    >
                        {name[0]}
                    </span>
                ))}
            </span>
        </button>
    )
}

interface TicketPreviewProps {
    facility: IFacility | null
    doctor: IDoctorDetail | null
    dayLabel: string | null
    time: string | null
    outcome: Outcome
    // Open times near one that was just taken
    nextOpen: SlotCell[]
    // After a 409, the time is still free: the clash was with the patient's own booking
    conflictStillOpen: boolean
    checking: boolean
    onBook: () => void
    onPick: (cell: SlotCell) => void
    onStartOver: () => void
    tz: string
    now: Date
}

// The visit being put together, printed line by line, with the Book button
function TicketPreview({
    facility,
    doctor,
    dayLabel,
    time,
    outcome,
    nextOpen,
    conflictStillOpen,
    checking,
    onBook,
    onPick,
    onStartOver,
    tz,
    now,
}: TicketPreviewProps) {
    if (outcome.kind === 'booked') {
        const { appointment } = outcome
        return (
            <aside id="visit-ticket" className="scroll-mt-20 lg:sticky lg:top-24">
                <div className="grid animate-pop gap-1 rounded-lg bg-secondary p-6 text-secondary-content shadow-lg motion-reduce:animate-none">
                    <span className="mb-2 grid size-11 place-items-center rounded-full bg-secondary-content text-secondary">
                        <LuCheck className="size-6" strokeWidth={3} />
                    </span>
                    <strong className="text-2xl tracking-tight">You're booked!</strong>
                    <span>
                        {appointment.doctor.name} · {dayLabel}, {formatTime(appointment.starts_at, appointment.facility.timezone)}
                    </span>
                    <span className="text-sm opacity-75">{appointment.facility.name}</span>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link to="/dashboard" className="btn btn-primary">
                            See my ticket
                            <LuArrowRight className="size-4" />
                        </Link>
                        <button type="button" onClick={onStartOver} className="btn btn-ghost text-secondary-content">
                            Book another
                        </button>
                    </div>
                </div>
            </aside>
        )
    }

    const lines: { label: string; value: string | null }[] = [
        { label: 'Clinic', value: facility?.name ?? null },
        { label: 'Doctor', value: doctor?.name ?? null },
        { label: 'Day', value: dayLabel },
        { label: 'Time', value: time },
    ]
    const ready = lines.every((line) => line.value)
    const busy = outcome.kind === 'booking'

    return (
        <aside id="visit-ticket" className="scroll-mt-20 lg:sticky lg:top-24">
            <div
                key={outcome.kind === 'conflict' ? `conflict-${outcome.minutes}` : 'ticket'}
                className={cn(
                    'rounded-lg px-6 pt-6 pb-6 shadow-lg ticket-sides',
                    outcome.kind === 'conflict' && 'animate-shake motion-reduce:animate-none',
                )}
            >
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="font-mono text-[0.68rem] tracking-[0.14em] text-copy-lighter uppercase">
                        Your visit
                    </span>
                    {facility && <LiveBadge>Live slots</LiveBadge>}
                </div>

                <dl className="m-0 mt-4 flex flex-col gap-3">
                    {lines.map((line) => (
                        <div key={line.label} className="flex items-baseline justify-between gap-4">
                            <dt className="font-mono text-[0.68rem] tracking-[0.12em] text-copy-lighter uppercase">
                                {line.label}
                            </dt>
                            {line.value ? (
                                <dd key={line.value} className="m-0 min-w-0 animate-print truncate text-right font-semibold text-copy motion-reduce:animate-none">
                                    {line.value}
                                </dd>
                            ) : (
                                <dd className="m-0 h-0 flex-1 border-b-2 border-dotted border-border" />
                            )}
                        </div>
                    ))}
                </dl>

                {facility && (
                    <p className="m-0 mt-3 text-right font-mono text-[0.6rem] tracking-[0.12em] text-copy-lighter uppercase">
                        Clinic time · {tz.replace(/_/g, ' ')} · {formatTime(now, tz)}
                    </p>
                )}

                {outcome.kind === 'conflict' && (
                    <div className="mt-5 animate-print rounded-md border border-border bg-background p-4 motion-reduce:animate-none" aria-live="polite">
                        {checking ? (
                            <p className="m-0 text-sm text-copy-light">Checking the day…</p>
                        ) : conflictStillOpen ? (
                            <>
                                <strong className="text-primary">You're already booked then</strong>
                                <p className="m-0 mt-1 text-sm text-copy-light">
                                    {/already has an appointment/.test(outcome.message)
                                        ? 'You have another visit at this clinic at that time. Pick a different time.'
                                        : outcome.message}
                                </p>
                            </>
                        ) : (
                            <>
                                <strong className="text-primary">Just taken</strong>
                                <p className="m-0 mt-1 text-sm text-copy-light">
                                    Someone got {outcome.label} a moment before you.
                                    {nextOpen.length > 0 ? ' Closest open times:' : ' Nothing else is open that day.'}
                                </p>
                                {nextOpen.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {nextOpen.map((cell) => (
                                            <button
                                                key={cell.minutes}
                                                type="button"
                                                onClick={() => onPick(cell)}
                                                className="rounded-sm border border-border bg-white px-3 py-2 text-sm font-semibold text-copy tabular-nums transition-colors hover:border-primary hover:text-primary"
                                            >
                                                {cell.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {outcome.kind === 'error' && (
                    <p role="alert" className="m-0 mt-5 rounded-sm bg-error/8 px-3.5 py-3 text-sm text-error-ink">
                        {outcome.message} Trying again is safe: you won't be booked twice.
                    </p>
                )}

                <button
                    type="button"
                    onClick={onBook}
                    disabled={!ready || busy}
                    className={cn(
                        'btn btn-primary mt-6 w-full py-3.5 text-base disabled:transform-none disabled:opacity-50',
                        busy && 'animate-tap cursor-progress motion-reduce:animate-none',
                    )}
                >
                    {busy ? (
                        <>
                            <span
                                className="inline-block size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                                aria-hidden="true"
                            />
                            Booking…
                        </>
                    ) : outcome.kind === 'error' ? (
                        <>
                            <LuRotateCcw className="size-4" />
                            Try again
                        </>
                    ) : ready ? (
                        `Book ${time?.slice(0, 5)}`
                    ) : (
                        'Pick a time'
                    )}
                </button>
                <p className="m-0 mt-3 text-center text-xs text-copy-lighter">
                    Free to cancel any time before the visit starts.
                </p>
            </div>
        </aside>
    )
}

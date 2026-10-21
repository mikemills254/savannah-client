import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuArrowRight, LuCheck, LuChevronRight, LuMapPin, LuRotateCcw, LuSearch } from 'react-icons/lu'
import { handleBookAppointment, handleGetFacilities } from '../../api/booking.ts'
import DayStrip from '../../components/booking/dayStrip.tsx'
import { bookingDay, partOfDay } from '../../components/booking/slots.ts'
import { useFacilityAvailability } from '../../components/booking/useFacilityAvailability.ts'
import { Accent, Eyebrow, LiveBadge } from '../../components/ui.tsx'
import { useClock } from '../../hooks/useClock.ts'
import { cn } from '../../lib/cn.ts'
import { initials } from '../../lib/initials.ts'
import type { IAppointment, IBookableFacility, IDoctorAvailability, ISlot } from '../../types/facility.types.ts'
import { clinicClock, dayHeading, formatTime } from '../facility/utils/clinicTime.ts'
import PatientShell from './patientShell.tsx'

type Outcome =
    | { kind: 'idle' }
    | { kind: 'booking' }
    | { kind: 'booked'; appointment: IAppointment }
    // 409: the slot went, or the patient already has a visit then
    | { kind: 'conflict'; doctorId: string; startsAt: string; message: string }
    | { kind: 'error'; message: string }

interface Pick {
    facilityId: string
    doctorId: string
    slot: ISlot
    // One per picked slot, reused if the same booking is retried
    idempotencyKey: string
}

// A doctor's free slots on a clinic-local day, minus any that started since the data loaded
function openSlots(doctor: IDoctorAvailability, date: string, now: Date): ISlot[] {
    const day = doctor.days.find((d) => d.date === date)
    return (day?.available_slots ?? []).filter((slot) => new Date(slot.starts_at) > now)
}

// The doctor's soonest free slot in the booking window
function nextOpen(doctor: IDoctorAvailability, now: Date): ISlot | null {
    for (const day of doctor.days) {
        const slot = day.available_slots.find((s) => new Date(s.starts_at) > now)
        if (slot) return slot
    }
    return null
}

const startOf = (slot: ISlot | null | undefined) => (slot ? new Date(slot.starts_at).getTime() : Infinity)

export default function BookVisit() {
    const now = useClock(30_000)
    const [params, setParams] = useSearchParams()

    // --- Clinics ---
    const [facilities, setFacilities] = useState<IBookableFacility[] | null>(null)
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

    // With a single clinic there's nothing to choose
    const facility =
        facilities?.find((f) => f.id === params.get('facility')) ?? (facilities?.length === 1 ? facilities[0] : null)
    const facilityId = facility?.id ?? null
    const tz = facility?.timezone ?? 'UTC'

    // --- Every doctor's free times over the next two weeks, in one request ---
    const availability = useFacilityAvailability(facilityId)
    const doctors = availability.data?.doctors ?? []
    // Narrowed to one doctor, or everyone
    const filter = doctors.find((d) => d.doctor_id === params.get('doctor')) ?? null
    const shownDoctors = filter ? [filter] : doctors

    const days = (availability.data?.days ?? []).map((d) => bookingDay(d.date))
    const openCount = (date: string) => shownDoctors.reduce((sum, d) => sum + openSlots(d, date, now).length, 0)
    // The asked-for day if it has anything free, otherwise the soonest one that does
    const day =
        days.find((d) => d.key === params.get('date') && openCount(d.key) > 0) ??
        days.find((d) => openCount(d.key) > 0) ??
        null

    // Doctors free that day first, earliest first; then the rest by when they're next free
    const rows = day
        ? shownDoctors
              .map((doctor) => ({ doctor, slots: openSlots(doctor, day.key, now), next: nextOpen(doctor, now) }))
              .sort(
                  (a, b) =>
                      Number(a.slots.length === 0) - Number(b.slots.length === 0) ||
                      startOf(a.slots[0] ?? a.next) - startOf(b.slots[0] ?? b.next),
              )
        : []

    // --- The picked time ---
    const [pick, setPick] = useState<Pick | null>(null)
    const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })

    const doctorOf = (id: string) => doctors.find((d) => d.doctor_id === id) ?? null
    const pickedDoctor = pick && pick.facilityId === facilityId ? doctorOf(pick.doctorId) : null
    // Only while the time is still free in the latest data
    const chosen =
        pick &&
        pickedDoctor &&
        openSlots(pickedDoctor, clinicClock(pick.slot.starts_at, tz).day, now).some(
            (s) => s.starts_at === pick.slot.starts_at,
        )
            ? pick
            : null

    const choose = (changes: Record<string, string | null>) => {
        const next = new URLSearchParams(params)
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
        }
        setParams(next, { replace: true })
        setOutcome({ kind: 'idle' })
    }

    const pickSlot = (doctorId: string, slot: ISlot) => {
        if (!facilityId) return
        setPick({ facilityId, doctorId, slot, idempotencyKey: crypto.randomUUID() })
        setOutcome({ kind: 'idle' })
    }

    const book = async () => {
        if (!chosen) return
        setOutcome({ kind: 'booking' })
        const response = await handleBookAppointment(
            // The clinic too: the doctor may work at several
            { doctor_id: chosen.doctorId, starts_at: chosen.slot.starts_at, facility_id: chosen.facilityId },
            chosen.idempotencyKey,
        )
        if (response.success && response.data) {
            setOutcome({ kind: 'booked', appointment: response.data })
            availability.reload()
        } else if (response.status === 409) {
            setOutcome({
                kind: 'conflict',
                doctorId: chosen.doctorId,
                startsAt: chosen.slot.starts_at,
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

    // After a 409, what's still free with that doctor that day
    let conflict: ConflictView | null = null
    if (outcome.kind === 'conflict') {
        const doctor = doctorOf(outcome.doctorId)
        const sameDay = doctor ? openSlots(doctor, clinicClock(outcome.startsAt, tz).day, now) : []
        const target = new Date(outcome.startsAt).getTime()
        conflict = {
            label: formatTime(outcome.startsAt, tz),
            message: outcome.message,
            checking: availability.loading,
            stillOpen: sameDay.some((s) => s.starts_at === outcome.startsAt),
            nearest: sameDay
                .filter((s) => s.starts_at !== outcome.startsAt)
                .sort((a, b) => Math.abs(startOf(a) - target) - Math.abs(startOf(b) - target))
                .slice(0, 3)
                .sort((a, b) => startOf(a) - startOf(b)),
        }
    }

    const live = facility && !changingClinic
    const chosenDoctor = chosen ? doctorOf(chosen.doctorId) : null
    const chosenTime = chosen
        ? `${formatTime(chosen.slot.starts_at, tz)}–${formatTime(chosen.slot.ends_at, tz)}`
        : null

    return (
        <PatientShell>
            <div className="max-w-2xl">
                <Eyebrow className="text-primary-light">Book a visit</Eyebrow>
                <h1 className="m-0 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-primary">
                    Find your <Accent className="text-primary-light">half hour.</Accent>
                </h1>
                <p className="m-0 mt-2 text-copy-light">
                    See every doctor's free times at once, straight from their real working hours, in the clinic's
                    own time.
                </p>
            </div>

            {/* minmax(0, …): the scrolling strips mustn't widen the columns past the screen */}
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-8 pb-24 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:pb-0">
                <div className="flex flex-col gap-6">
                    {/* 1. Where */}
                    <Step number={1} title="Where?" done={!!facility && !changingClinic}>
                        {facilitiesError ? (
                            <p className="m-0 text-sm text-error-ink">{facilitiesError}</p>
                        ) : !facilities ? (
                            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
                                {Array.from({ length: 4 }, (_, i) => (
                                    <div key={i} className="h-32 animate-pulse rounded-md bg-background" />
                                ))}
                            </div>
                        ) : facility && !changingClinic ? (
                            <div className="flex items-center gap-3 rounded-md border border-accent-border bg-accent-bg p-3.5">
                                <LuMapPin className="size-5 shrink-0 text-primary" />
                                <div className="min-w-0 flex-1">
                                    <p className="m-0 truncate font-semibold text-copy">{facility.name}</p>
                                    <p className="m-0 font-mono text-[0.68rem] tracking-[0.08em] text-copy-light">
                                        {facility.timezone.replace(/_/g, ' ')} · {formatTime(now, facility.timezone)} there now
                                    </p>
                                </div>
                                {facilities.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setChangingClinic(true)}
                                        className="border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>
                        ) : facilities.length === 0 ? (
                            <p className="m-0 text-sm text-copy-light">No clinics are taking bookings yet.</p>
                        ) : (
                            <ClinicPicker
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

                    {/* 2. When, and with whom */}
                    {live && (
                        <Step number={2} title="Pick a time" done={!!chosen}>
                            {availability.error && !availability.data ? (
                                <div className="rounded-md bg-background p-4 text-sm">
                                    <p className="m-0 text-error-ink">{availability.error}</p>
                                    <button
                                        type="button"
                                        onClick={availability.reload}
                                        className="mt-2 border-0 bg-transparent p-0 font-semibold text-primary hover:underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : !availability.data ? (
                                <div className="flex flex-col gap-3" aria-busy="true">
                                    <div className="h-20 animate-pulse rounded-md bg-background" />
                                    <div className="h-32 animate-pulse rounded-md bg-background" />
                                    <div className="h-32 animate-pulse rounded-md bg-background" />
                                </div>
                            ) : doctors.length === 0 ? (
                                <p className="m-0 text-sm text-copy-light">
                                    {facility.name} has no doctors taking bookings right now.
                                </p>
                            ) : (
                                <>
                                    {doctors.length > 1 && (
                                        <DoctorFilter
                                            doctors={doctors}
                                            selected={filter?.doctor_id ?? null}
                                            onSelect={(id) => choose({ doctor: id })}
                                        />
                                    )}

                                    {!day ? (
                                        <p className="m-0 rounded-md bg-background px-4 py-6 text-center text-sm text-copy-light">
                                            {filter ? `${filter.name} has` : `${facility.name} has`} no free times in
                                            the next two weeks.
                                            {filter && (
                                                <>
                                                    {' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => choose({ doctor: null })}
                                                        className="border-0 bg-transparent p-0 font-semibold text-primary hover:underline"
                                                    >
                                                        See all doctors
                                                    </button>
                                                </>
                                            )}
                                        </p>
                                    ) : (
                                        <>
                                            <DayStrip
                                                days={days}
                                                selected={day.key}
                                                openCount={(d) => openCount(d.key)}
                                                onSelect={(d) => choose({ date: d.key })}
                                            />
                                            <div
                                                className={cn(
                                                    'mt-4 flex flex-col gap-3 transition-opacity',
                                                    availability.loading && 'opacity-60',
                                                )}
                                                aria-busy={availability.loading}
                                            >
                                                {rows.map(({ doctor, slots, next }) => (
                                                    <DoctorTimes
                                                        key={doctor.doctor_id}
                                                        name={doctor.name}
                                                        slots={slots}
                                                        next={next}
                                                        selected={
                                                            chosen?.doctorId === doctor.doctor_id
                                                                ? chosen.slot.starts_at
                                                                : null
                                                        }
                                                        tz={tz}
                                                        now={now}
                                                        onPick={(slot) => pickSlot(doctor.doctor_id, slot)}
                                                        onJump={(date) => choose({ date })}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </Step>
                    )}
                </div>

                <TicketPreview
                    facilityName={live ? facility.name : null}
                    doctorName={live ? (chosenDoctor?.name ?? filter?.name ?? null) : null}
                    dayLabel={live && chosen ? dayHeading(chosen.slot.starts_at, now, tz) : null}
                    time={live ? chosenTime : null}
                    outcome={outcome}
                    conflict={conflict}
                    onBook={book}
                    onPick={(slot) => outcome.kind === 'conflict' && pickSlot(outcome.doctorId, slot)}
                    onStartOver={startOver}
                    tz={tz}
                    now={now}
                    showClock={!!live}
                />
            </div>

            {/* On small screens the ticket sits below the times, so the Book button follows you */}
            {chosen && chosenDoctor && outcome.kind !== 'booked' && (
                <div className="fixed inset-x-0 bottom-0 z-30 animate-rise border-t border-border bg-white/95 py-3 backdrop-blur motion-reduce:animate-none lg:hidden">
                    <div className="site-container flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="m-0 truncate font-mono text-[0.62rem] tracking-[0.12em] text-copy-lighter uppercase">
                                {chosenDoctor.name}
                            </p>
                            <p className="m-0 truncate font-bold text-copy">
                                {dayHeading(chosen.slot.starts_at, now, tz)} · {formatTime(chosen.slot.starts_at, tz)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={bookFromBar}
                            disabled={outcome.kind === 'booking'}
                            className="btn btn-primary shrink-0 disabled:cursor-progress disabled:opacity-70"
                        >
                            {outcome.kind === 'booking' ? 'Booking…' : `Book ${formatTime(chosen.slot.starts_at, tz)}`}
                        </button>
                    </div>
                </div>
            )}
        </PatientShell>
    )
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

interface ClinicPickerProps {
    facilities: IBookableFacility[]
    now: Date
    selected: string | null
    onSelect: (id: string) => void
}

// Clinics shown before "Show all"; past this many there's a search box too
const FIRST_CLINICS = 6

// "Africa/Nairobi" -> "Nairobi"
const cityOf = (timeZone: string) => (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ')

// The clinics as cards, the one with the soonest free time first
function ClinicPicker({ facilities, now, selected, onSelect }: ClinicPickerProps) {
    const [query, setQuery] = useState('')
    const [showAll, setShowAll] = useState(false)

    const search = query.trim().toLowerCase()
    const matches = facilities
        .filter((facility) => !search || facility.name.toLowerCase().includes(search))
        .sort(
            (a, b) => startOf(a.next_available) - startOf(b.next_available) || a.name.localeCompare(b.name),
        )
    const shown = search || showAll ? matches : matches.slice(0, FIRST_CLINICS)

    return (
        <div className="flex flex-col gap-4">
            {facilities.length > FIRST_CLINICS && (
                <div className="relative">
                    <LuSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-copy-lighter" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={`Search ${facilities.length} clinics`}
                        aria-label="Search clinics"
                        className="form-input pl-10"
                    />
                </div>
            )}

            {matches.length === 0 ? (
                <p className="m-0 rounded-md bg-background px-4 py-8 text-center text-sm text-copy-light">
                    No clinic matches “{query.trim()}”.
                </p>
            ) : (
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                    {shown.map((facility) => (
                        <li key={facility.id}>
                            <ClinicCard
                                facility={facility}
                                now={now}
                                selected={facility.id === selected}
                                onSelect={() => onSelect(facility.id)}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {shown.length < matches.length && (
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="self-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary-light"
                >
                    Show all {matches.length} clinics
                </button>
            )}
        </div>
    )
}

interface ClinicCardProps {
    facility: IBookableFacility
    now: Date
    selected: boolean
    onSelect: () => void
}

function ClinicCard({ facility, now, selected, onSelect }: ClinicCardProps) {
    const tz = facility.timezone
    const next = facility.next_available
    const day = next ? dayHeading(next.starts_at, now, tz) : null
    const today = day === 'Today'

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
                'group flex h-full w-full flex-col gap-4 rounded-md border bg-white p-4 text-left transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md',
                selected ? 'border-primary ring-2 ring-primary/15' : 'border-border',
            )}
        >
            <span className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-bg text-sm font-extrabold text-primary">
                    {initials(facility.name)}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-copy">{facility.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-copy-light">
                        <LuMapPin className="size-3.5 shrink-0" />
                        {cityOf(tz)} · {formatTime(now, tz)} there now
                    </span>
                </span>
                <LuChevronRight className="mt-1 size-4 shrink-0 text-copy-lighter transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-primary" />
            </span>

            {next ? (
                <span
                    className={cn(
                        'flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm',
                        today ? 'bg-secondary/25 text-lime-ink' : 'bg-accent-bg text-primary',
                    )}
                >
                    <span className="inline-flex items-center gap-2 font-medium">
                        <span
                            className={cn(
                                'size-2 rounded-full',
                                today ? 'animate-breathe bg-secondary-dark motion-reduce:animate-none' : 'bg-primary-light',
                            )}
                        />
                        Next free
                    </span>
                    <span className="font-bold tabular-nums">
                        {day} · {formatTime(next.starts_at, tz)}
                    </span>
                </span>
            ) : (
                <span className="rounded-sm bg-background px-3 py-2 text-sm text-copy-lighter">
                    No free times in the next two weeks
                </span>
            )}
        </button>
    )
}

interface DoctorFilterProps {
    doctors: IDoctorAvailability[]
    selected: string | null
    onSelect: (id: string | null) => void
}

// "Any doctor", or narrow the times to one
function DoctorFilter({ doctors, selected, onSelect }: DoctorFilterProps) {
    const options = [
        { id: null, label: 'Any doctor' },
        ...doctors.map((doctor) => ({ id: doctor.doctor_id, label: doctor.name })),
    ]

    return (
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Show times for">
            {options.map((option) => {
                const active = option.id === selected
                return (
                    <button
                        key={option.id ?? 'any'}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelect(option.id)}
                        className={cn(
                            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors',
                            active
                                ? 'border-primary bg-primary text-white'
                                : 'border-border bg-white text-copy-light hover:border-primary-light hover:text-primary',
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}

interface DoctorTimesProps {
    name: string
    // Free that day
    slots: ISlot[]
    // Soonest free slot on any day, for when that day is full
    next: ISlot | null
    // starts_at of the picked time, if it's this doctor's
    selected: string | null
    tz: string
    now: Date
    onPick: (slot: ISlot) => void
    onJump: (date: string) => void
}

// One doctor's free times on the chosen day, by part of the day
function DoctorTimes({ name, slots, next, selected, tz, now, onPick, onJump }: DoctorTimesProps) {
    const groups: { name: string; slots: ISlot[] }[] = []
    for (const slot of slots) {
        const part = partOfDay(clinicClock(slot.starts_at, tz).minutes)
        const last = groups[groups.length - 1]
        if (last?.name === part) last.slots.push(slot)
        else groups.push({ name: part, slots: [slot] })
    }

    return (
        <section
            className={cn(
                'rounded-md border p-4 transition-colors',
                selected ? 'border-primary-light bg-accent-bg/40' : 'border-border',
            )}
        >
            <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-secondary">
                    {initials(name)}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-bold text-copy">{name}</p>
                    <p className="m-0 text-xs text-copy-light">
                        {slots.length > 0
                            ? `${slots.length} free ${slots.length === 1 ? 'time' : 'times'}`
                            : 'Fully booked this day'}
                    </p>
                </div>
            </div>

            {slots.length > 0 ? (
                <div className="mt-3 flex flex-col gap-3">
                    {groups.map((group) => (
                        <div key={group.name}>
                            <p className="m-0 mb-1.5 font-mono text-[0.6rem] tracking-[0.16em] text-copy-lighter uppercase">
                                {group.name}
                            </p>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                {group.slots.map((slot) => {
                                    const label = formatTime(slot.starts_at, tz)
                                    const active = slot.starts_at === selected
                                    return (
                                        <button
                                            key={slot.starts_at}
                                            type="button"
                                            aria-pressed={active}
                                            aria-label={`${name}, ${label}`}
                                            onClick={() => onPick(slot)}
                                            className={cn(
                                                'rounded-sm border py-2 text-sm font-semibold tabular-nums transition-[background,border-color,color,scale] duration-200 active:scale-95',
                                                active
                                                    ? 'border-secondary-dark bg-secondary text-secondary-content shadow-sm'
                                                    : 'border-border bg-white text-copy hover:border-primary hover:text-primary',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : next ? (
                <button
                    type="button"
                    onClick={() => onJump(clinicClock(next.starts_at, tz).day)}
                    className="mt-3 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                >
                    Next free: {dayHeading(next.starts_at, now, tz)}, {formatTime(next.starts_at, tz)}
                    <LuArrowRight className="size-4" />
                </button>
            ) : (
                <p className="m-0 mt-3 text-sm text-copy-lighter">No free times in the next two weeks.</p>
            )}
        </section>
    )
}

interface ConflictView {
    // "10:30", the time that couldn't be booked
    label: string
    message: string
    // The day is being reloaded
    checking: boolean
    // The time is still free: the clash was with the patient's own booking
    stillOpen: boolean
    // Free times with the same doctor closest to it
    nearest: ISlot[]
}

interface TicketPreviewProps {
    facilityName: string | null
    doctorName: string | null
    dayLabel: string | null
    time: string | null
    outcome: Outcome
    conflict: ConflictView | null
    onBook: () => void
    onPick: (slot: ISlot) => void
    onStartOver: () => void
    tz: string
    now: Date
    showClock: boolean
}

// The visit being put together, printed line by line, with the Book button
function TicketPreview({
    facilityName,
    doctorName,
    dayLabel,
    time,
    outcome,
    conflict,
    onBook,
    onPick,
    onStartOver,
    tz,
    now,
    showClock,
}: TicketPreviewProps) {
    if (outcome.kind === 'booked') {
        const { appointment } = outcome
        const clinicTz = appointment.facility.timezone
        return (
            <aside id="visit-ticket" className="scroll-mt-20 lg:sticky lg:top-24">
                <div className="grid animate-pop gap-1 rounded-lg bg-secondary p-6 text-secondary-content shadow-lg motion-reduce:animate-none">
                    <span className="mb-2 grid size-11 place-items-center rounded-full bg-secondary-content text-secondary">
                        <LuCheck className="size-6" strokeWidth={3} />
                    </span>
                    <strong className="text-2xl tracking-tight">You're booked!</strong>
                    <span>
                        {appointment.doctor.name} · {dayHeading(appointment.starts_at, now, clinicTz)},{' '}
                        {formatTime(appointment.starts_at, clinicTz)}
                    </span>
                    <span className="text-sm opacity-75">{appointment.facility.name}</span>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link to="/visits" className="btn btn-primary">
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
        { label: 'Clinic', value: facilityName },
        { label: 'Doctor', value: doctorName },
        { label: 'Day', value: dayLabel },
        { label: 'Time', value: time },
    ]
    const ready = lines.every((line) => line.value)
    const busy = outcome.kind === 'booking'

    return (
        <aside id="visit-ticket" className="scroll-mt-20 lg:sticky lg:top-24">
            <div
                key={conflict ? `conflict-${conflict.label}` : 'ticket'}
                className={cn('rounded-lg px-6 pt-6 pb-6 shadow-lg ticket-sides', conflict && 'animate-shake motion-reduce:animate-none')}
            >
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="font-mono text-[0.68rem] tracking-[0.14em] text-copy-lighter uppercase">
                        Your visit
                    </span>
                    {showClock && <LiveBadge>Live slots</LiveBadge>}
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

                {showClock && (
                    <p className="m-0 mt-3 text-right font-mono text-[0.6rem] tracking-[0.12em] text-copy-lighter uppercase">
                        Clinic time · {tz.replace(/_/g, ' ')} · {formatTime(now, tz)}
                    </p>
                )}

                {conflict && (
                    <div className="mt-5 animate-print rounded-md border border-border bg-background p-4 motion-reduce:animate-none" aria-live="polite">
                        {conflict.checking ? (
                            <p className="m-0 text-sm text-copy-light">Checking the day…</p>
                        ) : conflict.stillOpen ? (
                            <>
                                <strong className="text-primary">You're already booked then</strong>
                                <p className="m-0 mt-1 text-sm text-copy-light">
                                    {/already has an appointment/.test(conflict.message)
                                        ? 'You have another visit at this clinic at that time. Pick a different time.'
                                        : conflict.message}
                                </p>
                            </>
                        ) : (
                            <>
                                <strong className="text-primary">Just taken</strong>
                                <p className="m-0 mt-1 text-sm text-copy-light">
                                    Someone got {conflict.label} a moment before you.
                                    {conflict.nearest.length > 0
                                        ? ' Closest free times with the same doctor:'
                                        : ' Nothing else is free with them that day.'}
                                </p>
                                {conflict.nearest.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {conflict.nearest.map((slot) => (
                                            <button
                                                key={slot.starts_at}
                                                type="button"
                                                onClick={() => onPick(slot)}
                                                className="rounded-sm border border-border bg-white px-3 py-2 text-sm font-semibold text-copy tabular-nums transition-colors hover:border-primary hover:text-primary"
                                            >
                                                {formatTime(slot.starts_at, tz)}
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

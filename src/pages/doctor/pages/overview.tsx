import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuMapPin, LuTriangleAlert } from 'react-icons/lu'
import ReschedulePanel from '../../../components/booking/reschedulePanel.tsx'
import FreshPill from '../../../components/live/freshPill.tsx'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { useClock } from '../../../hooks/useClock.ts'
import { useCurrentUser } from '../../../hooks/useCurrentUser.ts'
import { cn } from '../../../lib/cn.ts'
import { useLiveStore } from '../../../store/useLiveStore.ts'
import type { IFacility } from '../../../types/auth.types.ts'
import type { IAppointment, IWorkingHour } from '../../../types/facility.types.ts'
import CancelVisitButton from '../../facility/components/ui/cancelVisitButton.tsx'
import Panel from '../../facility/components/ui/panel.tsx'
import {
    clinicClock,
    dayHeading,
    formatDuration,
    formatMinutes,
    formatTime,
    toMinutes,
    visitWhen,
} from '../../facility/utils/clinicTime.ts'
import { WEEKDAY_NAMES, weeklyMinutes } from '../../facility/utils/schedule.ts'
import DoctorShell from '../components/doctorShell.tsx'
import { useDoctorStore } from '../store/useDoctorStore.ts'

// Visits listed before "Show all"
const FIRST_VISITS = 12

// /doctor: the doctor's day across every facility they work at
export default function DoctorOverview() {
    return (
        <DoctorShell>
            <Overview />
        </DoctorShell>
    )
}

function greeting(now: Date): string {
    const hour = now.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

function Overview() {
    const user = useCurrentUser()
    const hours = useDoctorStore((s) => s.hours)
    const appointments = useDoctorStore((s) => s.appointments)
    const now = useClock(30_000)
    const [showAll, setShowAll] = useState(false)

    const facilities = user.facilities
    const missingHours = facilities.filter((f) => (hours[f.id] ?? []).length === 0)

    // Booked visits that haven't ended, soonest first, across every facility
    const upcoming = facilities
        .flatMap((f) => appointments[f.id] ?? [])
        .filter((a) => a.status === 'BOOKED' && new Date(a.ends_at) > now)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    const shown = showAll ? upcoming : upcoming.slice(0, FIRST_VISITS)
    const firstName = user.name.replace(/^Dr\.?\s+/i, '').split(' ')[0]

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Eyebrow className="text-primary-light">Overview</Eyebrow>
                <h1 className="m-0 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-primary">
                    {greeting(now)}, <Accent className="text-primary-light">Dr. {firstName}.</Accent>
                </h1>
            </div>

            {/* Patients can't book a doctor at a facility where they have no hours */}
            {missingHours.map((f) => (
                <div
                    key={f.id}
                    className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <p className="m-0 flex items-start gap-2.5 text-sm text-warning-content">
                        <LuTriangleAlert className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <strong>No hours at {f.name} yet.</strong> Patients can't book you there until you add them.
                        </span>
                    </p>
                    <Link to={`/doctor/hours?facility=${f.id}`} className="btn btn-primary shrink-0 px-4 py-2 text-sm">
                        Add hours
                        <LuArrowRight className="size-4" />
                    </Link>
                </div>
            ))}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <section className="flex flex-col gap-3">
                    <h2 className="m-0 text-base font-bold">
                        {facilities.length === 1 ? 'Your clinic' : `Your clinics (${facilities.length})`}
                    </h2>
                    {facilities.length === 0 ? (
                        <Panel>
                            <p className="m-0 text-sm text-copy-light">You're not linked to a clinic yet.</p>
                        </Panel>
                    ) : (
                        facilities.map((f) => (
                            <ClinicCard
                                key={f.id}
                                facility={f}
                                hours={hours[f.id] ?? []}
                                todayVisits={
                                    (appointments[f.id] ?? []).filter(
                                        (a) =>
                                            a.status === 'BOOKED' &&
                                            clinicClock(a.starts_at, f.timezone).day === clinicClock(now, f.timezone).day,
                                    ).length
                                }
                                now={now}
                            />
                        ))
                    )}
                </section>

                <Panel title="Upcoming visits" className="h-fit">
                    {upcoming.length === 0 ? (
                        <p className="m-0 py-8 text-center text-sm text-copy-light">
                            No visits booked in the next 30 days.
                        </p>
                    ) : (
                        <>
                            <VisitList appointments={shown} now={now} showClinic={facilities.length > 1} />
                            {shown.length < upcoming.length && (
                                <button
                                    type="button"
                                    onClick={() => setShowAll(true)}
                                    className="mt-3 border-0 bg-transparent p-0 text-sm font-semibold text-primary hover:underline"
                                >
                                    Show all {upcoming.length} visits
                                </button>
                            )}
                        </>
                    )}
                </Panel>
            </div>
        </div>
    )
}

interface ClinicCardProps {
    facility: IFacility
    hours: IWorkingHour[]
    todayVisits: number
    now: Date
}

// One facility: where it is, today's hours there, and the weekly pattern
function ClinicCard({ facility, hours, todayVisits, now }: ClinicCardProps) {
    const tz = facility.timezone
    const clock = clinicClock(now, tz)
    const workDays = new Set(hours.map((hour) => hour.weekday))
    const todays = hours
        .filter((hour) => hour.weekday === clock.weekday)
        .map((hour) => ({ start: toMinutes(hour.start_time), end: toMinutes(hour.end_time) }))
        .sort((a, b) => a.start - b.start)
    const current = todays.find((s) => clock.minutes >= s.start && clock.minutes < s.end)
    const next = todays.find((s) => s.start > clock.minutes)

    const today =
        hours.length === 0
            ? 'No hours set'
            : current
              ? `On duty until ${formatMinutes(current.end)}`
              : next
                ? `Starts at ${formatMinutes(next.start)} today`
                : todays.length > 0
                  ? 'Done for today'
                  : 'Off today'

    return (
        <article className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-bg text-primary">
                    <LuMapPin className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-bold text-copy">{facility.name}</p>
                    <p className="m-0 mt-0.5 text-xs text-copy-light">
                        {tz.replace(/_/g, ' ')} · {formatTime(now, tz)} there now
                    </p>
                </div>
                <Link
                    to={`/doctor/hours?facility=${facility.id}`}
                    className="shrink-0 text-sm font-semibold text-primary hover:underline"
                >
                    Edit hours
                </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className={cn('font-semibold', current ? 'text-success' : 'text-copy')}>{today}</span>
                <span className="text-copy-light">
                    {todayVisits} {todayVisits === 1 ? 'visit' : 'visits'} today
                </span>
                {hours.length > 0 && <span className="text-copy-light">{formatDuration(weeklyMinutes(hours))} a week</span>}
            </div>

            {/* Which days of the week they work here */}
            <div className="mt-3 flex gap-1" aria-label={`Works ${WEEKDAY_NAMES.filter((_, i) => workDays.has(i)).join(', ') || 'no days yet'}`}>
                {WEEKDAY_NAMES.map((name, weekday) => (
                    <span
                        key={name}
                        className={cn(
                            'grid h-6 flex-1 place-items-center rounded-[6px] text-[0.62rem] font-bold',
                            workDays.has(weekday) ? 'bg-primary text-secondary' : 'bg-background text-copy-lighter',
                            weekday === clock.weekday && 'ring-2 ring-primary-light/40',
                        )}
                    >
                        {name[0]}
                    </span>
                ))}
            </div>
        </article>
    )
}

// One visit: its time and patient, and, until it starts, moving or cancelling it.
// A visit a patient or the clinic just booked or changed is marked as new.
function VisitItem({ visit, now, showClinic }: { visit: IAppointment; now: Date; showClinic: boolean }) {
    const fresh = useLiveStore((s) => s.fresh[visit.id])
    const cancelAppointment = useDoctorStore((s) => s.cancelAppointment)
    const rescheduleAppointment = useDoctorStore((s) => s.rescheduleAppointment)
    const [moving, setMoving] = useState(false)
    const tz = visit.facility.timezone
    const inProgress = new Date(visit.starts_at) <= now

    return (
        <li
            // A new key on each change replays the highlight
            key={fresh ? `${fresh}:${visit.starts_at}` : 'row'}
            className={cn(
                'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm py-2.5',
                fresh && 'animate-arrive motion-reduce:animate-none',
            )}
        >
            <span
                className={cn(
                    'w-24 shrink-0 text-sm font-semibold tabular-nums',
                    inProgress ? 'text-success' : 'text-copy',
                )}
            >
                {formatTime(visit.starts_at, tz)}–{formatTime(visit.ends_at, tz)}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-copy">
                    <span className="truncate">{visit.patient.name}</span>
                    {fresh && <FreshPill type={fresh} />}
                </span>
                {showClinic && <span className="block truncate text-xs text-copy-light">{visit.facility.name}</span>}
            </span>
            {inProgress ? (
                <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                    Now
                </span>
            ) : (
                !moving && (
                    <span className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMoving(true)}
                            className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary-light"
                        >
                            Move
                        </button>
                        <CancelVisitButton
                            label="Cancel"
                            placeholder="The patient sees this, so keep it clear, e.g. I'm away at a conference"
                            confirmLabel="Cancel visit"
                            details={`${visit.patient.name} · ${visitWhen(visit.starts_at, tz)} · ${visit.facility.name}`}
                            reasons={["I'm unavailable", 'Patient asked to cancel', 'Emergency came up']}
                            onConfirm={(reason) => cancelAppointment(visit.id, reason)}
                        />
                    </span>
                )
            )}
            {moving && !inProgress && (
                // min-w-0: the panel's two-week day strip scrolls instead of widening the row
                <div className="min-w-0 basis-full">
                    <ReschedulePanel
                        appointment={visit}
                        onMove={(startsAt) => rescheduleAppointment(visit.id, startsAt)}
                        onClose={() => setMoving(false)}
                    />
                </div>
            )}
        </li>
    )
}

// Visits grouped by day, each in its own facility's time
function VisitList({ appointments, now, showClinic }: { appointments: IAppointment[]; now: Date; showClinic: boolean }) {
    const groups: { day: string; visits: IAppointment[] }[] = []
    for (const visit of appointments) {
        const day = dayHeading(visit.starts_at, now, visit.facility.timezone)
        const last = groups[groups.length - 1]
        if (last?.day === day) last.visits.push(visit)
        else groups.push({ day, visits: [visit] })
    }

    return (
        <div className="flex flex-col gap-4">
            {groups.map((group) => (
                <div key={group.day}>
                    <p className="m-0 mb-2 font-mono text-[0.62rem] tracking-[0.16em] text-copy-lighter uppercase">
                        {group.day}
                    </p>
                    <ul className="m-0 list-none divide-y divide-border p-0">
                        {group.visits.map((visit) => (
                            <VisitItem key={visit.id} visit={visit} now={now} showClinic={showClinic} />
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    )
}

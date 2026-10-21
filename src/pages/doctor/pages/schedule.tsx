import { useNavigate, useSearchParams } from 'react-router-dom'
import { LuArrowRight, LuCheck, LuTriangleAlert } from 'react-icons/lu'
import DayRow from '../../../components/schedule/dayRow.tsx'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { useClock } from '../../../hooks/useClock.ts'
import { useCurrentUser } from '../../../hooks/useCurrentUser.ts'
import { cn } from '../../../lib/cn.ts'
import Panel from '../../facility/components/ui/panel.tsx'
import { clinicClock, formatDuration, formatTime, toMinutes } from '../../facility/utils/clinicTime.ts'
import { shiftRange, WEEKDAY_NAMES, weeklyMinutes } from '../../facility/utils/schedule.ts'
import DoctorShell from '../components/doctorShell.tsx'
import { useDoctorStore } from '../store/useDoctorStore.ts'

// /doctor/hours: the doctor's weekly hours at each facility they work at.
// ?facility= picks the facility; ?setup=1 is the first visit, straight after accepting an invite.
export default function DoctorSchedule() {
    return (
        <DoctorShell>
            <Schedule />
        </DoctorShell>
    )
}

function Schedule() {
    const user = useCurrentUser()
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const allHours = useDoctorStore((s) => s.hours)
    const addShift = useDoctorStore((s) => s.addShift)
    const removeShift = useDoctorStore((s) => s.removeShift)
    const now = useClock(60_000)

    const facilities = user.facilities
    const facility = facilities.find((f) => f.id === params.get('facility')) ?? facilities[0]
    const setup = params.get('setup') === '1'

    if (!facility) {
        return (
            <Panel>
                <p className="m-0 py-10 text-center text-sm text-copy-light">
                    You're not linked to a clinic yet. Ask the clinic that invited you to add you again.
                </p>
            </Panel>
        )
    }

    const tz = facility.timezone
    const hours = [...(allHours[facility.id] ?? [])].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
    const weekly = weeklyMinutes(hours)
    const workDays = new Set(hours.map((hour) => hour.weekday)).size
    const today = clinicClock(now, tz).weekday
    const others = facilities.filter((f) => f.id !== facility.id)

    // The doctor's shifts at their other facilities on a weekday, to avoid double-booking themselves
    const elsewhere = (weekday: number) =>
        others.flatMap((other) =>
            (allHours[other.id] ?? [])
                .filter((hour) => hour.weekday === weekday)
                .map((hour) => `${other.name} ${shiftRange(hour)}`),
        )

    return (
        <div className="flex flex-col gap-6">
            <div className="max-w-2xl">
                <Eyebrow className="text-primary-light">{setup ? 'One last step' : 'My hours'}</Eyebrow>
                {setup ? (
                    <>
                        <h1 className="m-0 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-primary">
                            Welcome to <Accent className="text-primary-light">{facility.name}.</Accent>
                        </h1>
                        <p className="m-0 mt-2 text-copy-light">
                            Add the hours you work here. Patients can book you as soon as you've added your first shift.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="m-0 text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-primary">
                            Your <Accent className="text-primary-light">week.</Accent>
                        </h1>
                        <p className="m-0 mt-2 text-copy-light">
                            Set when you work at each clinic. Patients only see times inside these hours.
                        </p>
                    </>
                )}
            </div>

            {/* One tab per facility, flagged when it has no hours yet */}
            {facilities.length > 1 && (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Clinic">
                    {facilities.map((f) => {
                        const active = f.id === facility.id
                        const hasHours = (allHours[f.id] ?? []).length > 0
                        return (
                            <button
                                key={f.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => {
                                    const next = new URLSearchParams(params)
                                    next.set('facility', f.id)
                                    setParams(next, { replace: true })
                                }}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                                    active
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-border bg-white text-copy-light hover:border-primary-light hover:text-primary',
                                )}
                            >
                                {hasHours ? (
                                    <LuCheck className={cn('size-4', active ? 'text-secondary' : 'text-success')} />
                                ) : (
                                    <LuTriangleAlert className="size-4 text-warning" />
                                )}
                                {f.name}
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {hours.length > 0 ? (
                    <p className="m-0 text-sm text-copy-light">
                        <span className="font-semibold text-copy">{formatDuration(weekly)}</span> a week at{' '}
                        {facility.name}, across {workDays} {workDays === 1 ? 'day' : 'days'}
                    </p>
                ) : (
                    <p className="m-0 rounded-sm bg-warning/15 px-3 py-2 text-sm text-warning-content">
                        No hours at {facility.name} yet, so patients can't book you there.
                    </p>
                )}
                <p className="m-0 text-xs text-copy-lighter">
                    Clinic time · {tz.replace(/_/g, ' ')} · {formatTime(now, tz)} now
                </p>
            </div>

            <Panel title="Weekly schedule">
                <ul className="m-0 list-none divide-y divide-border p-0">
                    {WEEKDAY_NAMES.map((name, weekday) => (
                        <DayRow
                            // Keyed by facility too, so a half-filled form doesn't carry over to the next clinic
                            key={`${facility.id}-${weekday}`}
                            weekday={weekday}
                            name={name}
                            isToday={weekday === today}
                            shifts={hours.filter((hour) => hour.weekday === weekday)}
                            elsewhere={elsewhere(weekday)}
                            onAdd={(shift) => addShift(facility.id, shift)}
                            onRemove={(id) => removeShift(facility.id, id)}
                        />
                    ))}
                </ul>
            </Panel>

            {setup && (
                <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="m-0 text-sm text-copy-light">
                        {hours.length > 0
                            ? "You're bookable. You can change these hours any time from My hours."
                            : 'You can add hours later from My hours, but patients can only book you once you do.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/doctor', { replace: true })}
                        className={cn('btn shrink-0', hours.length > 0 ? 'btn-primary' : 'btn-ghost')}
                    >
                        {hours.length > 0 ? 'Done, go to my overview' : 'Skip for now'}
                        <LuArrowRight className="size-4" />
                    </button>
                </div>
            )}
        </div>
    )
}

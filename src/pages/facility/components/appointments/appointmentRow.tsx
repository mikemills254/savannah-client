import { useState } from 'react'
import type { IAppointment } from '../../../../types/facility.types.ts'
import ReschedulePanel from '../../../../components/booking/reschedulePanel.tsx'
import FreshPill from '../../../../components/live/freshPill.tsx'
import { cn } from '../../../../lib/cn.ts'
import { useLiveStore } from '../../../../store/useLiveStore.ts'
import { useFacilityStore } from '../../store/useFacilityStore.ts'
import { formatTime, visitWhen } from '../../utils/clinicTime.ts'
import { visitState } from '../../utils/schedule.ts'
import CancelVisitButton from '../ui/cancelVisitButton.tsx'
import VisitBadge from '../ui/visitBadge.tsx'

interface AppointmentRowProps {
    appointment: IAppointment
    now: Date
    timeZone: string
    // Off for a doctor's own list, where it would always be them
    showDoctor?: boolean
}

// Who did something to the visit, unless it was the patient themselves
function byStaff(appointment: IAppointment, person: IAppointment['booked_by']): string | null {
    if (!person || person.id === appointment.patient.id) return null
    return person.id === appointment.doctor.id ? 'the doctor' : person.name
}

export default function AppointmentRow({ appointment, now, timeZone, showDoctor = true }: AppointmentRowProps) {
    const cancelAppointment = useFacilityStore((s) => s.cancelAppointment)
    const rescheduleAppointment = useFacilityStore((s) => s.rescheduleAppointment)
    // Set while someone else's change to it is new
    const fresh = useLiveStore((s) => s.fresh[appointment.id])
    const [moving, setMoving] = useState(false)
    const state = visitState(appointment, now)
    const bookedBy = byStaff(appointment, appointment.booked_by)
    // Unknown for cancellations made before it was recorded
    const cancelledBy =
        state === 'cancelled' && appointment.cancelled_by
            ? (byStaff(appointment, appointment.cancelled_by) ?? 'the patient')
            : null

    return (
        <li
            // Remounts on each change, so the highlight plays again
            key={fresh ? `${fresh}:${appointment.starts_at}` : 'row'}
            className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm px-2 py-3 transition-colors hover:bg-background',
                fresh && 'animate-arrive motion-reduce:animate-none',
            )}
        >
            <p className="m-0 w-24 shrink-0 text-sm font-semibold tabular-nums text-copy">
                {formatTime(appointment.starts_at, timeZone)}
                <span className="font-normal text-copy-lighter">–{formatTime(appointment.ends_at, timeZone)}</span>
            </p>

            <div className="min-w-0 flex-1">
                <p
                    className={cn(
                        'm-0 flex items-center gap-2 text-sm font-medium',
                        state === 'cancelled' ? 'text-copy-lighter line-through' : 'text-copy',
                    )}
                >
                    <span className="truncate">{appointment.patient.name}</span>
                    {fresh && <FreshPill type={fresh} />}
                </p>
                <p className="m-0 truncate text-xs text-copy-light">
                    {[
                        showDoctor && `with ${appointment.doctor.name}`,
                        bookedBy && `booked by ${bookedBy}`,
                        cancelledBy && `cancelled by ${cancelledBy}`,
                        state === 'cancelled' && appointment.cancellation_reason,
                    ]
                        .filter(Boolean)
                        .join(' · ') || 'Booked online'}
                </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
                {/* Only visits that haven't started can still be moved or called off */}
                {state === 'upcoming' && !moving && (
                    <>
                        <button
                            type="button"
                            onClick={() => setMoving(true)}
                            className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary-light"
                        >
                            Move
                        </button>
                        <CancelVisitButton
                            label="Cancel"
                            placeholder="The patient sees this, so keep it clear, e.g. the doctor is away at a conference"
                            confirmLabel="Cancel visit"
                            details={`${appointment.patient.name} with ${appointment.doctor.name} · ${visitWhen(appointment.starts_at, timeZone)}`}
                            reasons={['Doctor unavailable', 'Patient asked to cancel', 'Clinic closed that day']}
                            onConfirm={(reason) => cancelAppointment(appointment.id, reason)}
                        />
                    </>
                )}
                <VisitBadge state={state} />
            </div>

            {moving && state === 'upcoming' && (
                // min-w-0: the panel's two-week day strip scrolls instead of widening the row
                <div className="min-w-0 basis-full">
                    <ReschedulePanel
                        appointment={appointment}
                        onMove={(startsAt) => rescheduleAppointment(appointment.id, startsAt)}
                        onClose={() => setMoving(false)}
                    />
                </div>
            )}
        </li>
    )
}

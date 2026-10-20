import type { IAppointment } from '../../../../types/facility.types.ts'
import { cn } from '../../../../lib/cn.ts'
import { useFacilityStore } from '../../store/useFacilityStore.ts'
import { formatTime } from '../../utils/clinicTime.ts'
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
    const state = visitState(appointment, now)
    const bookedBy = byStaff(appointment, appointment.booked_by)
    // Unknown for cancellations made before it was recorded
    const cancelledBy =
        state === 'cancelled' && appointment.cancelled_by
            ? (byStaff(appointment, appointment.cancelled_by) ?? 'the patient')
            : null

    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm px-2 py-3 transition-colors hover:bg-background">
            <p className="m-0 w-24 shrink-0 text-sm font-semibold tabular-nums text-copy">
                {formatTime(appointment.starts_at, timeZone)}
                <span className="font-normal text-copy-lighter">–{formatTime(appointment.ends_at, timeZone)}</span>
            </p>

            <div className="min-w-0 flex-1">
                <p
                    className={cn(
                        'm-0 truncate text-sm font-medium',
                        state === 'cancelled' ? 'text-copy-lighter line-through' : 'text-copy',
                    )}
                >
                    {appointment.patient.name}
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
                {/* Only visits that haven't started can still be called off */}
                {state === 'upcoming' && (
                    <CancelVisitButton
                        label="Cancel"
                        placeholder="Reason, e.g. doctor unavailable"
                        confirmLabel="Yes, cancel"
                        onConfirm={(reason) => cancelAppointment(appointment.id, reason)}
                    />
                )}
                <VisitBadge state={state} />
            </div>
        </li>
    )
}

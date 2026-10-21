import { cn } from '../../lib/cn.ts'
import type { AppointmentEventType } from '../../types/events.types.ts'

const LABELS: Record<AppointmentEventType, string> = {
    'appointment.booked': 'New',
    'appointment.rescheduled': 'Moved',
    'appointment.cancelled': 'Just cancelled',
}

// Marks a visit someone else changed while the page was open
export default function FreshPill({ type }: { type: AppointmentEventType }) {
    return (
        <span
            className={cn(
                // inline-block: a cancelled row's line-through doesn't reach it
                'inline-block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                type === 'appointment.cancelled'
                    ? 'bg-error/10 text-error-ink'
                    : 'bg-secondary text-secondary-content',
            )}
        >
            {LABELS[type]}
        </span>
    )
}

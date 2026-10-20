import type { IAppointment } from '../../../../types/facility.types.ts'
import { cn } from '../../../../lib/cn.ts'
import { visitState, type RosterEntry } from '../../utils/schedule.ts'

interface StatCardsProps {
    // Today's appointments only
    appointments: IAppointment[]
    roster: RosterEntry[]
    now: Date
}

interface Stat {
    label: string
    value: number
    note: string
    warn?: boolean
}

export default function StatCards({ appointments, roster, now }: StatCardsProps) {
    const booked = appointments.filter((appointment) => appointment.status === 'BOOKED')
    const remaining = booked.filter((appointment) => visitState(appointment, now) === 'upcoming').length
    const cancelled = appointments.length - booked.length

    const active = roster.filter(({ duty }) => duty.state !== 'inactive').length
    const onDuty = roster.filter(({ duty }) => duty.state === 'on-duty').length
    const unbookable = roster.filter(({ duty }) => duty.state === 'no-hours').length

    const stats: Stat[] = [
        {
            label: 'Booked today',
            value: booked.length,
            note: remaining > 0 ? `${remaining} still to come` : 'None left today',
        },
        {
            label: 'On duty now',
            value: onDuty,
            note: `of ${active} active doctors`,
        },
        {
            label: 'Cancelled today',
            value: cancelled,
            note: `out of ${appointments.length} made`,
        },
        {
            label: 'Not bookable',
            value: unbookable,
            note: 'Doctors without working hours',
            warn: unbookable > 0,
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className={cn(
                        'rounded-md border p-4 sm:p-5',
                        stat.warn ? 'border-warning bg-warning/10' : 'border-border bg-white',
                    )}
                >
                    <p className="m-0 text-xs font-medium text-copy-light sm:text-sm">{stat.label}</p>
                    <p className="m-0 mt-1 text-2xl font-bold tabular-nums text-copy sm:text-3xl">{stat.value}</p>
                    <p className="m-0 mt-1 text-xs text-copy-lighter">{stat.note}</p>
                </div>
            ))}
        </div>
    )
}

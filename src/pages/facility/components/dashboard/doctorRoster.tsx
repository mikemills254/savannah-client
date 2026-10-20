import { Link } from 'react-router-dom'
import { cn } from '../../../../lib/cn.ts'
import type { DutyState, RosterEntry } from '../../utils/schedule.ts'
import Avatar from '../ui/avatar.tsx'
import Panel from '../ui/panel.tsx'

// Who's around now first, deactivated accounts last
const order: DutyState[] = ['on-duty', 'later', 'finished', 'off', 'no-hours', 'inactive']

const dots: Record<DutyState, string> = {
    'on-duty': 'bg-success',
    later: 'bg-primary-light',
    finished: 'bg-copy-lighter',
    off: 'bg-border',
    'no-hours': 'bg-warning',
    inactive: 'bg-border',
}

interface DoctorRosterProps {
    roster: RosterEntry[]
    // Admins manage the doctors; a doctor only sees themselves here
    canManage: boolean
}

export default function DoctorRoster({ roster, canManage }: DoctorRosterProps) {
    const sorted = [...roster].sort((a, b) => order.indexOf(a.duty.state) - order.indexOf(b.duty.state))

    return (
        <Panel
            title={canManage ? 'Doctors today' : 'Your day'}
            action={
                canManage && (
                    <Link to="/dashboard/doctors" className="text-sm font-semibold text-primary hover:underline">
                        Manage
                    </Link>
                )
            }
        >
            {sorted.length === 0 ? (
                <p className="m-0 py-6 text-center text-sm text-copy-light">No doctors added yet.</p>
            ) : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {sorted.map(({ doctor, duty }) => (
                        <li key={doctor.id} className="flex items-center gap-3">
                            <Avatar name={doctor.name} muted={duty.state === 'inactive'}>
                                <span
                                    className={cn(
                                        'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-white',
                                        dots[duty.state],
                                    )}
                                />
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={cn(
                                        'm-0 truncate text-sm font-medium',
                                        duty.state === 'inactive' ? 'text-copy-lighter' : 'text-copy',
                                    )}
                                >
                                    {doctor.name}
                                </p>
                                <p className="m-0 truncate text-xs text-copy-light">{duty.label}</p>
                            </div>

                            {duty.state === 'no-hours' && (
                                <Link
                                    to={`/dashboard/hours?doctor=${doctor.id}`}
                                    className="shrink-0 rounded-full bg-warning/20 px-2.5 py-1 text-xs font-semibold text-warning-content hover:bg-warning/30"
                                >
                                    Add hours
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    )
}

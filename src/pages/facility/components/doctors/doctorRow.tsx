import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { IMember } from '../../../../types/facility.types.ts'
import { useFacilityStore } from '../../store/useFacilityStore.ts'
import { formatDuration } from '../../utils/clinicTime.ts'
import Avatar from '../ui/avatar.tsx'
import ConfirmButton from '../ui/confirmButton.tsx'

interface DoctorRowProps {
    doctor: IMember
    // Scheduled minutes per week
    weekly: number
    upcoming: number
}

export default function DoctorRow({ doctor, weekly, upcoming }: DoctorRowProps) {
    const setMemberActive = useFacilityStore((s) => s.setMemberActive)
    const firstName = doctor.name.split(' ')[0]

    return (
        <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={doctor.name} muted={!doctor.is_active} />
                <div className="min-w-0">
                    <p className="m-0 flex items-center gap-2 text-sm font-semibold text-copy">
                        <span className="truncate">{doctor.name}</span>
                        {!doctor.is_active && (
                            <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-copy-light">
                                Deactivated
                            </span>
                        )}
                    </p>
                    <p className="m-0 truncate text-xs text-copy-light">{doctor.email}</p>
                </div>
            </div>

            <div className="flex gap-8 pl-12 text-xs text-copy-light sm:w-48 sm:pl-0">
                <p className="m-0">
                    {weekly > 0 ? (
                        <span className="block text-sm font-semibold text-copy">{formatDuration(weekly)}</span>
                    ) : (
                        <span className="block text-sm font-semibold text-warning-content">None</span>
                    )}
                    a week
                </p>
                <p className="m-0">
                    <span className="block text-sm font-semibold tabular-nums text-copy">{upcoming}</span>
                    upcoming
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-12 sm:w-64 sm:justify-end sm:pl-0">
                {doctor.is_active ? (
                    <>
                        <Link
                            to={`/dashboard/hours?doctor=${doctor.id}`}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary-light"
                        >
                            {weekly > 0 ? 'Edit hours' : 'Add hours'}
                        </Link>
                        <ConfirmButton
                            label="Deactivate"
                            question={`Deactivate ${firstName}?`}
                            confirmLabel="Deactivate"
                            onConfirm={() => setMemberActive(doctor.id, false)}
                        />
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() =>
                            setMemberActive(doctor.id, true).then(
                                () => toast.success(`${firstName} is back on your staff`),
                                (error: Error) => toast.error(error.message),
                            )
                        }
                        className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary-light"
                    >
                        Reactivate
                    </button>
                )}
            </div>
        </li>
    )
}

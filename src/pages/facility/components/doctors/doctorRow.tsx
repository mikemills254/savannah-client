import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LuSend } from 'react-icons/lu'
import { handleReissueMemberInvite } from '../../../../api/facility.ts'
import { unwrap } from '../../../../api/request.ts'
import InviteLink from '../../../../components/inviteLink.tsx'
import type { IMember } from '../../../../types/facility.types.ts'
import { useFacilityStore } from '../../store/useFacilityStore.ts'
import { formatDuration } from '../../utils/clinicTime.ts'
import Avatar from '../ui/avatar.tsx'
import ConfirmButton from '../ui/confirmButton.tsx'

// Active staff who haven't accepted their invite can't log in yet
export function InvitePendingPill() {
    return (
        <span className="shrink-0 rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-semibold text-warning-content">
            Invite pending
        </span>
    )
}

interface ReissueInviteButtonProps {
    facilityId: string | null
    member: IMember
    // The link is shown by the row, under it
    onIssued: (token: string) => void
}

// Issues a fresh invite, e.g. when the first one expired or got lost
export function ReissueInviteButton({ facilityId, member, onIssued }: ReissueInviteButtonProps) {
    const [busy, setBusy] = useState(false)

    const reissue = async () => {
        if (!facilityId) return
        setBusy(true)
        try {
            onIssued(unwrap(await handleReissueMemberInvite(facilityId, member.id)).invite_token)
        } catch (error) {
            // 409: they set a password since this list loaded
            toast.error(error instanceof Error ? error.message : "Couldn't create a new invite")
        } finally {
            setBusy(false)
        }
    }

    return (
        <button
            type="button"
            onClick={reissue}
            disabled={busy || !facilityId}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary-light disabled:cursor-progress disabled:opacity-60"
        >
            <LuSend className="size-3.5" />
            {busy ? 'Working…' : 'New invite link'}
        </button>
    )
}

interface DoctorRowProps {
    doctor: IMember
    // Scheduled minutes per week
    weekly: number
    upcoming: number
}

export default function DoctorRow({ doctor, weekly, upcoming }: DoctorRowProps) {
    const setMemberActive = useFacilityStore((s) => s.setMemberActive)
    const facilityId = useFacilityStore((s) => s.facilityId)
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const firstName = doctor.name.split(' ')[0]
    const pending = doctor.is_active && doctor.has_password === false

    return (
        <li className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
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
                            {pending && <InvitePendingPill />}
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
                            {pending && (
                                <ReissueInviteButton facilityId={facilityId} member={doctor} onIssued={setInviteToken} />
                            )}
                            <Link
                                to={`/${facilityId}/dashboard/hours?doctor=${doctor.id}`}
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
            </div>

            {/* Hidden again once they're deactivated or the list shows they've accepted */}
            {pending && inviteToken && (
                <div className="mt-3 sm:pl-12">
                    <InviteLink token={inviteToken} name={doctor.name} />
                </div>
            )}
        </li>
    )
}

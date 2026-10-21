import { useState } from 'react'
import toast from 'react-hot-toast'
import { handleAddMember, handleDeactivateMember } from '../../../api/facility.ts'
import { unwrap } from '../../../api/request.ts'
import InviteLink from '../../../components/inviteLink.tsx'
import type { IMember } from '../../../types/facility.types.ts'
import { InvitePendingPill, ReissueInviteButton } from '../../facility/components/doctors/doctorRow.tsx'
import Avatar from '../../facility/components/ui/avatar.tsx'
import ConfirmButton from '../../facility/components/ui/confirmButton.tsx'

interface StaffRowProps {
    facilityId: string
    member: IMember
    // The member as the server returned it after a change
    onChange: (member: IMember) => void
}

export default function StaffRow({ facilityId, member, onChange }: StaffRowProps) {
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [restoring, setRestoring] = useState(false)
    const firstName = member.name.split(' ')[0]
    const pending = member.is_active && member.has_password === false

    // 409 for a clinic's last active admin; ConfirmButton toasts the server's message
    const deactivate = async () => {
        onChange(unwrap(await handleDeactivateMember(facilityId, member.id)))
        setInviteToken(null)
    }

    // Re-adding a deactivated member's email restores their account
    const restore = async () => {
        setRestoring(true)
        try {
            const { member: restored, invite_token } = unwrap(
                await handleAddMember(facilityId, { email: member.email, role: member.role }),
            )
            onChange(restored)
            setInviteToken(invite_token)
            toast.success(`${firstName} is back on the staff`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't restore them")
        } finally {
            setRestoring(false)
        }
    }

    return (
        <li className="flex flex-wrap items-center gap-3 py-3">
            <Avatar name={member.name} muted={!member.is_active} />
            <div className="min-w-0 flex-1">
                <p className="m-0 flex items-center gap-2 text-sm font-semibold text-copy">
                    <span className="truncate">{member.name}</span>
                    {!member.is_active && (
                        <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-copy-light">
                            Deactivated
                        </span>
                    )}
                    {pending && <InvitePendingPill />}
                </p>
                <p className="m-0 truncate text-xs text-copy-light">{member.email}</p>
            </div>

            {member.is_active ? (
                <div className="flex flex-wrap items-center gap-2">
                    {pending && <ReissueInviteButton facilityId={facilityId} member={member} onIssued={setInviteToken} />}
                    <ConfirmButton
                        label="Deactivate"
                        question={`Deactivate ${firstName}?`}
                        confirmLabel="Deactivate"
                        onConfirm={deactivate}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={restore}
                    disabled={restoring}
                    className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary-light disabled:cursor-progress disabled:opacity-60"
                >
                    {restoring ? 'Working…' : 'Restore'}
                </button>
            )}

            {pending && inviteToken && (
                <div className="basis-full pl-12">
                    <InviteLink token={inviteToken} name={member.name} />
                </div>
            )}
        </li>
    )
}

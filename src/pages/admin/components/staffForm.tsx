import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { handleAddMember } from '../../../api/facility.ts'
import { unwrap } from '../../../api/request.ts'
import InviteLink from '../../../components/inviteLink.tsx'
import type { IMember, StaffRole } from '../../../types/facility.types.ts'
import { UserRole } from '../../../types/types.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface StaffFormProps {
    facilityId: string
    // The clinic's whole staff: an email can only belong to one account
    members: IMember[]
    initialRole: StaffRole
    onAdded: (member: IMember) => void
    onClose: () => void
}

// Adds an admin or doctor to a clinic, like the clinic's own MemberForm but with a role picker
export default function StaffForm({ facilityId, members, initialRole, onAdded, onClose }: StaffFormProps) {
    const [role, setRole] = useState<StaffRole>(initialRole)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    // Shown once they're added, if they still need to set a password
    const [invite, setInvite] = useState<{ token: string; name: string } | null>(null)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const normalized = email.trim().toLowerCase()
        const existing = members.find((member) => member.email === normalized)

        if (!EMAIL_PATTERN.test(normalized)) return setError('Enter a valid email address')
        if (existing?.is_active) return setError(`${existing.name} is already on this clinic's staff`)
        // A returning member keeps the name on their account
        if (!existing && !name.trim()) return setError("Enter the person's name")

        setSubmitting(true)
        setError(null)
        try {
            const { member, invite_token } = unwrap(
                await handleAddMember(facilityId, { email: normalized, role, name: name.trim() || undefined }),
            )
            onAdded(member)
            if (invite_token) {
                setInvite({ token: invite_token, name: member.name })
            } else {
                toast.success(`${member.name.split(' ')[0]} can log in again`)
                onClose()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't add them")
        } finally {
            setSubmitting(false)
        }
    }

    if (invite) {
        return (
            <div className="flex flex-col gap-3">
                <InviteLink token={invite.token} name={invite.name} />
                {role === UserRole.DOCTOR && (
                    <p className="m-0 text-xs text-copy-lighter">Doctors are also sent this link by email.</p>
                )}
                <button type="button" onClick={onClose} className="btn btn-ghost self-start">
                    Done
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-copy">
                    Role
                    <select
                        className="form-input select-chevron"
                        value={role}
                        onChange={(event) => setRole(event.target.value as StaffRole)}
                    >
                        <option value={UserRole.FACILITY_ADMIN}>Admin</option>
                        <option value={UserRole.DOCTOR}>Doctor</option>
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-copy">
                    Full name
                    <input
                        className="form-input"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="off"
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-copy">
                    Email
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="off"
                    />
                </label>
            </div>

            {error && (
                <p role="alert" className="m-0 mt-3 text-sm text-error-ink">
                    {error}
                </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary disabled:cursor-progress disabled:opacity-70"
                >
                    {submitting ? 'Adding…' : role === UserRole.DOCTOR ? 'Add doctor' : 'Add admin'}
                </button>
                <button type="button" onClick={onClose} className="btn btn-ghost">
                    Cancel
                </button>
            </div>
            <p className="m-0 mt-3 text-xs text-copy-lighter">
                They set their own password from an invite link. An email that already has an account elsewhere
                can't be added. Re-adding someone who was deactivated restores their account.
            </p>
        </form>
    )
}

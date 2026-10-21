import { useState, type FormEvent } from 'react'
import { UserRole } from '../../../../types/types.ts'
import type { IMember, StaffRole } from '../../../../types/facility.types.ts'
import InviteLink from '../../../../components/inviteLink.tsx'
import { useFacilityStore } from '../../store/useFacilityStore.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface MemberFormProps {
    role: StaffRole
    // Everyone on the staff, any role: an email can only belong to one account
    members: IMember[]
    onClose: () => void
}

export default function MemberForm({ role, members, onClose }: MemberFormProps) {
    const addMember = useFacilityStore((s) => s.addMember)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    // Shown once they're added, if they still need to set a password
    const [invite, setInvite] = useState<{ token: string; name: string } | null>(null)
    // Shown once a doctor who already works at another clinic is linked here
    const [linked, setLinked] = useState<string | null>(null)

    const noun = role === UserRole.DOCTOR ? 'doctor' : 'admin'

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const normalized = email.trim().toLowerCase()
        const existing = members.find((member) => member.email === normalized)

        if (!EMAIL_PATTERN.test(normalized)) return setError('Enter a valid email address')
        if (existing?.is_active) return setError(`${existing.name} is already on your staff`)
        // A returning member keeps the name on their account
        if (!existing && !name.trim()) return setError(`Enter the ${noun}'s name`)

        setSubmitting(true)
        setError(null)
        try {
            const { member, invite_token } = await addMember({ name, email: normalized, role })
            if (invite_token) setInvite({ token: invite_token, name: member.name })
            // New to this clinic but already signed up: a doctor from another clinic
            else if (!existing && member.has_password) setLinked(member.name)
            else onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : `Couldn't add the ${noun}`)
        } finally {
            setSubmitting(false)
        }
    }

    if (linked) {
        return (
            <div className="flex flex-col gap-3">
                <div role="status" className="rounded-md border border-accent-border bg-accent-bg px-4 py-3 text-sm text-copy">
                    <p className="m-0 font-semibold text-primary">{linked} has joined your clinic</p>
                    <p className="m-0 mt-1 text-copy-light">
                        They already use DocConnect at another clinic, so they keep their account and sign in as usual.
                        We've emailed them to set their hours here; until then patients can't book them at your clinic.
                    </p>
                </div>
                <button type="button" onClick={onClose} className="btn btn-ghost self-start">
                    Done
                </button>
            </div>
        )
    }

    if (invite) {
        return (
            <div className="flex flex-col gap-3">
                <InviteLink token={invite.token} name={invite.name} />
                <button type="button" onClick={onClose} className="btn btn-ghost self-start">
                    Done
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-copy">
                    Full name
                    <input
                        className="form-input"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="off"
                    />
                </label>
                <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-copy">
                    Email
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="off"
                    />
                </label>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary flex-1 disabled:cursor-progress disabled:opacity-70 sm:flex-none"
                    >
                        {submitting ? 'Adding…' : `Add ${noun}`}
                    </button>
                    <button type="button" onClick={onClose} className="btn btn-ghost">
                        Cancel
                    </button>
                </div>
            </div>

            {error && (
                <p role="alert" className="m-0 mt-3 text-sm text-error-ink">
                    {error}
                </p>
            )}
            <p className="m-0 mt-3 text-xs text-copy-lighter">
                They set their own password from an invite link. Adding someone who was deactivated restores their
                account and history.{' '}
                {role === UserRole.DOCTOR &&
                    'A doctor who already works at another clinic keeps their account and is linked to yours, with separate hours here.'}
            </p>
        </form>
    )
}

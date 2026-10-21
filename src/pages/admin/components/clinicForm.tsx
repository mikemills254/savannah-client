import { useState, type FormEvent } from 'react'
import { handleCreateFacility } from '../../../api/admin.ts'
import { unwrap } from '../../../api/request.ts'
import type { IFacility } from '../../../types/auth.types.ts'

const FALLBACK_ZONES = ['Africa/Nairobi', 'Africa/Lagos', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'Asia/Dubai']

// Older browsers lack supportedValuesOf; the server checks the name either way
function timeZones(): string[] {
    const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
    return supported ? supported('timeZone') : FALLBACK_ZONES
}

interface ClinicFormProps {
    onCreated: (facility: IFacility) => void
    onClose: () => void
}

export default function ClinicForm({ onCreated, onClose }: ClinicFormProps) {
    const [zones] = useState(timeZones)
    const [name, setName] = useState('')
    // Most clinics are set up from where they are
    const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!name.trim()) return setError("Enter the clinic's name")

        setSubmitting(true)
        setError(null)
        try {
            onCreated(unwrap(await handleCreateFacility({ name: name.trim(), timezone })))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't create the clinic")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-copy">
                Clinic name
                <input
                    className="form-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={150}
                    autoComplete="off"
                    autoFocus
                    placeholder="St. Jude Health Center"
                />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-copy">
                Time zone
                <select
                    className="form-input select-chevron"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                >
                    {zones.map((zone) => (
                        <option key={zone} value={zone}>
                            {zone.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </label>

            {error && (
                <p role="alert" className="m-0 text-sm text-error-ink">
                    {error}
                </p>
            )}

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 disabled:cursor-progress disabled:opacity-70"
                >
                    {submitting ? 'Creating…' : 'Create clinic'}
                </button>
                <button type="button" onClick={onClose} className="btn btn-ghost">
                    Cancel
                </button>
            </div>
            <p className="m-0 text-xs text-copy-lighter">
                It goes live straight away. Bookings and doctors' hours use this time zone, and it can't be changed
                here later.
            </p>
        </form>
    )
}

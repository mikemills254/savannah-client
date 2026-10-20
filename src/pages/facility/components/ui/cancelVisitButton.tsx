import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'

interface CancelVisitButtonProps {
    label: string
    confirmLabel: string
    placeholder?: string
    // May be a request; its error message is shown if it fails
    onConfirm: (reason: string) => void | Promise<void>
}

// Cancelling a visit: asks inline for the reason, which the API requires
export default function CancelVisitButton({
    label,
    confirmLabel,
    placeholder = 'Reason for cancelling',
    onConfirm,
}: CancelVisitButtonProps) {
    const [asking, setAsking] = useState(false)
    const [reason, setReason] = useState('')
    const [busy, setBusy] = useState(false)

    const close = () => {
        setAsking(false)
        setReason('')
    }

    const confirm = async (event: FormEvent) => {
        event.preventDefault()
        const trimmed = reason.trim()
        if (!trimmed) return
        setBusy(true)
        try {
            await onConfirm(trimmed)
            close()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        } finally {
            setBusy(false)
        }
    }

    if (!asking) {
        return (
            <button
                type="button"
                onClick={() => setAsking(true)}
                className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-copy-light transition-colors hover:border-error hover:text-error-ink"
            >
                {label}
            </button>
        )
    }

    return (
        <form onSubmit={confirm} className="flex flex-wrap items-center gap-2 text-xs">
            <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                maxLength={500}
                required
                autoFocus
                disabled={busy}
                className="min-w-0 flex-1 basis-40 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-copy outline-none focus:border-primary"
            />
            <button
                type="submit"
                disabled={busy || !reason.trim()}
                className="rounded-full border-0 bg-error px-3 py-1.5 font-semibold text-error-content hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {busy ? 'Working…' : confirmLabel}
            </button>
            <button
                type="button"
                onClick={close}
                disabled={busy}
                className="border-0 bg-transparent px-1 py-1.5 font-semibold text-copy-light hover:text-copy"
            >
                Keep
            </button>
        </form>
    )
}

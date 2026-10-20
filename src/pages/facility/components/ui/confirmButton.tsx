import { useState } from 'react'
import toast from 'react-hot-toast'

interface ConfirmButtonProps {
    label: string
    question: string
    confirmLabel: string
    // May be a request; its error message is shown if it fails
    onConfirm: () => void | Promise<void>
}

// A destructive action that asks once, inline, before it runs
export default function ConfirmButton({ label, question, confirmLabel, onConfirm }: ConfirmButtonProps) {
    const [asking, setAsking] = useState(false)
    const [busy, setBusy] = useState(false)

    const confirm = async () => {
        setBusy(true)
        try {
            await onConfirm()
            setAsking(false)
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
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-copy-light">{question}</span>
            <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className="rounded-full border-0 bg-error px-3 py-1.5 font-semibold text-error-content hover:opacity-90 disabled:cursor-progress disabled:opacity-60"
            >
                {busy ? 'Working…' : confirmLabel}
            </button>
            <button
                type="button"
                onClick={() => setAsking(false)}
                disabled={busy}
                className="border-0 bg-transparent px-1 py-1.5 font-semibold text-copy-light hover:text-copy"
            >
                Keep
            </button>
        </div>
    )
}

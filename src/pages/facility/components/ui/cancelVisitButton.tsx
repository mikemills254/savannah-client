import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { LuCalendarX2, LuX } from 'react-icons/lu'
import { cn } from '../../../../lib/cn.ts'

// The API caps the reason at this many characters
const MAX_REASON = 500

interface CancelVisitButtonProps {
    label: string
    confirmLabel: string
    placeholder?: string
    // The visit being cancelled, e.g. "Dr. Miller · Sat 24 Oct, 13:00 · St. Jude Health Clinic"
    details?: string
    // One-tap reasons shown above the text box
    reasons?: string[]
    // May be a request; its error message is shown if it fails
    onConfirm: (reason: string) => void | Promise<unknown>
}

// Cancelling a visit: a dialog asks for the reason, which the API requires
export default function CancelVisitButton({
    label,
    confirmLabel,
    placeholder = 'Tell them why you are cancelling',
    details,
    reasons = [],
    onConfirm,
}: CancelVisitButtonProps) {
    const dialog = useRef<HTMLDialogElement>(null)
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [busy, setBusy] = useState(false)
    const titleId = useId()

    // showModal() puts the dialog above everything, traps focus and closes on Escape
    useEffect(() => {
        if (open) dialog.current?.showModal()
    }, [open])

    const close = () => {
        if (busy) return
        dialog.current?.close()
    }

    const confirm = async (event: FormEvent) => {
        event.preventDefault()
        const trimmed = reason.trim()
        if (!trimmed) return
        setBusy(true)
        try {
            await onConfirm(trimmed)
            dialog.current?.close()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-copy-light transition-colors hover:border-error hover:text-error-ink"
            >
                {label}
            </button>

            {open &&
                createPortal(
                    <dialog
                        ref={dialog}
                        aria-labelledby={titleId}
                        // Escape and the close button both end up here
                        onClose={() => {
                            setOpen(false)
                            setReason('')
                        }}
                        onCancel={(event) => busy && event.preventDefault()}
                        // A click on the backdrop lands on the dialog itself
                        onClick={(event) => event.target === event.currentTarget && close()}
                        className={cn(
                            'w-full max-w-none border-0 bg-transparent p-0 text-copy backdrop:bg-ink/50 backdrop:backdrop-blur-[2px]',
                            // A sheet from the bottom on phones, a centred card from sm up
                            'mt-auto mb-0 sm:m-auto sm:max-w-lg',
                        )}
                    >
                        <form
                            onSubmit={confirm}
                            className="animate-rise rounded-t-2xl bg-white p-5 shadow-lg motion-reduce:animate-none sm:rounded-lg sm:p-6"
                        >
                            <div className="flex items-start gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-error/10 text-error-ink">
                                    <LuCalendarX2 className="size-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h2 id={titleId} className="m-0 text-lg font-bold">
                                        Cancel this visit?
                                    </h2>
                                    {details && <p className="m-0 mt-0.5 text-sm text-copy-light">{details}</p>}
                                </div>
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Close"
                                    className="rounded-full border-0 bg-transparent p-1.5 text-copy-lighter hover:bg-background hover:text-copy"
                                >
                                    <LuX className="size-5" />
                                </button>
                            </div>

                            {reasons.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Common reasons">
                                    {reasons.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setReason(option)}
                                            aria-pressed={reason === option}
                                            className={cn(
                                                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                                                reason === option
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-border bg-white text-copy-light hover:border-primary-light hover:text-primary',
                                            )}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <label className="mt-4 block text-sm font-semibold text-copy">
                                Reason
                                <textarea
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    placeholder={placeholder}
                                    maxLength={MAX_REASON}
                                    rows={4}
                                    required
                                    autoFocus
                                    disabled={busy}
                                    className="form-input mt-1.5 min-h-28 resize-y font-[inherit] font-normal leading-relaxed"
                                />
                            </label>
                            <p className="m-0 mt-1.5 flex justify-between gap-3 text-xs text-copy-lighter">
                                <span>Shared with everyone on the visit.</span>
                                <span className="tabular-nums">
                                    {reason.length}/{MAX_REASON}
                                </span>
                            </p>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button type="button" onClick={close} disabled={busy} className="btn btn-ghost">
                                    Keep visit
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy || !reason.trim()}
                                    className="btn border-0 bg-error text-error-content hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {busy ? 'Cancelling…' : confirmLabel}
                                </button>
                            </div>
                        </form>
                    </dialog>,
                    document.body,
                )}
        </>
    )
}

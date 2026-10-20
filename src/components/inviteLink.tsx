import { useState } from 'react'
import toast from 'react-hot-toast'
import { LuCheck, LuCopy, LuSend } from 'react-icons/lu'

interface InviteLinkProps {
    token: string
    // Who it's for, e.g. "Jane"
    name: string
}

// The link someone opens to set their first password. There's no email
// sending yet, so staff copy it and pass it on.
export default function InviteLink({ token, name }: InviteLinkProps) {
    const [copied, setCopied] = useState(false)
    const url = `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`
    const firstName = name.split(' ')[0]

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success('Invite link copied')
        } catch {
            toast.error("Couldn't copy. Select the link and copy it yourself.")
        }
    }

    return (
        <div className="animate-print rounded-md border border-dashed border-accent-border bg-accent-bg p-4 motion-reduce:animate-none">
            <p className="m-0 flex items-center gap-2 text-sm font-semibold text-primary">
                <LuSend className="size-4 shrink-0" />
                Send {firstName} this link to set a password
            </p>
            <div className="mt-3 flex gap-2">
                <input
                    readOnly
                    value={url}
                    aria-label={`Invite link for ${name}`}
                    onFocus={(event) => event.currentTarget.select()}
                    className="form-input min-w-0 flex-1 font-mono text-xs"
                />
                <button type="button" onClick={copy} className="btn btn-primary shrink-0 px-4 py-2 text-sm">
                    {copied ? <LuCheck className="size-4" /> : <LuCopy className="size-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <p className="m-0 mt-2 text-xs text-copy-light">It works once, for 72 hours.</p>
        </div>
    )
}

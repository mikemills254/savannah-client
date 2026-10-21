import { useState } from 'react'
import { LuPlus, LuShare, LuX } from 'react-icons/lu'
import { isIOS, promptInstall, useInstallState } from './install.ts'

const DISMISSED_KEY = 'docconnect:install-dismissed'
// "Not now" hides the banner for this long
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000

// Storage can be unavailable (private windows, blocked site data); the banner still works
function snoozed(): boolean {
    try {
        const at = Number(localStorage.getItem(DISMISSED_KEY))
        return Number.isFinite(at) && Date.now() - at < SNOOZE_MS
    } catch {
        return false
    }
}

function snooze() {
    try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    } catch {
        // Hidden for this visit only
    }
}

// Invites visitors to install DocConnect. Uses the browser's install dialog
// where there is one (Chrome, Edge, Android); on iPhone and iPad, where there
// isn't, it explains Add to Home Screen. Never shown inside the installed app.
export default function InstallBanner() {
    const { canPrompt, installed } = useInstallState()
    const [hidden, setHidden] = useState(snoozed)
    const [busy, setBusy] = useState(false)
    const ios = isIOS()

    if (installed || hidden || !(canPrompt || ios)) return null

    const dismiss = () => {
        snooze()
        setHidden(true)
    }

    const install = async () => {
        setBusy(true)
        try {
            // Declined: the browser won't offer it again this visit, so step aside
            if (!(await promptInstall())) dismiss()
        } finally {
            setBusy(false)
        }
    }

    return (
        <aside
            aria-label="Install the DocConnect app"
            className="fixed inset-x-0 bottom-0 z-50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-104 sm:p-0"
        >
            <div className="flex animate-rise items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-lg motion-reduce:animate-none">
                <img
                    src="/icons/icon-192.png"
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-xl border border-border"
                />

                <div className="min-w-0 flex-1">
                    <p className="m-0 font-bold text-copy">Get the DocConnect app</p>

                    {canPrompt ? (
                        <>
                            <p className="m-0 mt-0.5 text-sm leading-snug text-copy-light">
                                Open it from your home screen and book a visit in a few taps.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={install}
                                    disabled={busy}
                                    className="btn btn-primary px-4 py-2 text-sm disabled:cursor-progress disabled:opacity-70"
                                >
                                    {busy ? 'Opening…' : 'Install app'}
                                </button>
                                <button type="button" onClick={dismiss} className="btn btn-ghost px-3 py-2 text-sm">
                                    Not now
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="m-0 mt-0.5 text-sm leading-relaxed text-copy-light">
                            Tap{' '}
                            <LuShare className="inline size-4 -translate-y-px text-primary" aria-label="Share" /> Share,
                            then{' '}
                            <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-copy">
                                <LuPlus className="size-3.5" aria-hidden="true" />
                                Add to Home Screen
                            </span>
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss"
                    className="-mt-1 -mr-1 shrink-0 rounded-full border-0 bg-transparent p-1.5 text-copy-lighter hover:bg-background hover:text-copy"
                >
                    <LuX className="size-4" />
                </button>
            </div>
        </aside>
    )
}

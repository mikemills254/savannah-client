import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore.ts'
import type { IAuthUser } from '../types/auth.types.ts'

// Only the parts of Google Identity Services used here; no @types package needed
interface GoogleCredentialResponse {
    // The ID token the API verifies
    credential: string
}

interface GoogleButtonOptions {
    type?: 'standard' | 'icon'
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'large' | 'medium' | 'small'
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    logo_alignment?: 'left' | 'center'
    // In pixels, 200 to 400
    width?: number
}

interface GoogleAccountsId {
    initialize: (config: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
        cancel_on_tap_outside?: boolean
    }) => void
    renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
}

declare global {
    interface Window {
        google?: { accounts: { id: GoogleAccountsId } }
    }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

// One script tag for the whole app, however many buttons mount. Cleared on
// failure so a later mount can try again (e.g. after going back online)
let gsiLoad: Promise<GoogleAccountsId> | null = null

function loadGoogle(): Promise<GoogleAccountsId> {
    const ready = window.google?.accounts?.id
    if (ready) return Promise.resolve(ready)

    gsiLoad ??= new Promise<GoogleAccountsId>((resolve, reject) => {
        const script = document.createElement('script')
        const fail = () => {
            gsiLoad = null
            script.remove()
            reject(new Error("Couldn't load Google sign-in"))
        }
        script.src = SCRIPT_SRC
        script.async = true
        script.onload = () => {
            const gsi = window.google?.accounts?.id
            if (gsi) resolve(gsi)
            else fail()
        }
        script.onerror = fail
        document.head.appendChild(script)
    })
    return gsiLoad
}

interface GoogleSignInProps {
    // Wording on Google's button
    text?: 'signin_with' | 'signup_with' | 'continue_with'
    onSignedIn: (user: IAuthUser) => void
    // For the page's own alert
    onError: (message: string) => void
}

// "or" divider plus Google's button. Renders nothing when no client id is configured
export default function GoogleSignIn(props: GoogleSignInProps) {
    if (!CLIENT_ID) return null
    return <GoogleButton clientId={CLIENT_ID} {...props} />
}

function GoogleButton({
    clientId,
    text = 'continue_with',
    onSignedIn,
    onError,
}: GoogleSignInProps & { clientId: string }) {
    const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
    const slot = useRef<HTMLDivElement>(null)
    const [failed, setFailed] = useState(false)
    const [busy, setBusy] = useState(false)

    // Google calls back once the person has picked an account
    const signIn = useEffectEvent(async (credential: string) => {
        setBusy(true)
        try {
            onSignedIn(await loginWithGoogle(credential))
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.')
        } finally {
            setBusy(false)
        }
    })

    useEffect(() => {
        let cancelled = false
        loadGoogle().then(
            (gsi) => {
                const parent = slot.current
                if (cancelled || !parent) return
                // initialize is global to the page, so whichever button mounted last owns the callback
                gsi.initialize({ client_id: clientId, callback: (response) => signIn(response.credential) })
                gsi.renderButton(parent, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text,
                    logo_alignment: 'center',
                    width: Math.max(200, Math.min(400, parent.clientWidth)),
                })
            },
            () => {
                // Blocked or offline: the email form still works, so just drop the button
                if (!cancelled) setFailed(true)
            },
        )
        return () => {
            cancelled = true
        }
    }, [clientId, text])

    if (failed) return null

    return (
        <div>
            <div
                className="my-5 flex items-center gap-3 font-mono text-[0.7rem] font-semibold tracking-[0.14em] text-copy-lighter uppercase before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border"
                aria-hidden="true"
            >
                or
            </div>
            <div className="relative" aria-busy={busy}>
                {/* Google draws its button (an iframe) in here */}
                <div ref={slot} className="flex min-h-10 justify-center" />
                {busy && (
                    <div className="absolute inset-0 grid place-items-center rounded-full bg-white/85 text-sm font-semibold text-copy-light">
                        Signing you in…
                    </div>
                )}
            </div>
        </div>
    )
}

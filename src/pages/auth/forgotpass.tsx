import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuMailCheck } from 'react-icons/lu'
import { useClock } from '../../hooks/useClock.ts'
import { maskEmail } from './utils.ts'
import { AuthAlert, AuthTopbar, WebsiteLink } from './ui.tsx'
import { authLabel, authLinkBtn, authRise, authSubmit } from './styles.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { cn } from '../../lib/cn.ts'
import { handleForgotPassword } from '../../api/auth.ts'

// --- Class strings ---

const monoCaps = 'font-mono uppercase text-copy-lighter'
const doseRowClass = 'flex items-baseline gap-3 py-[0.4rem] [border-bottom:1px_dotted_var(--border)]'
const doseKeyClass = cn(monoCaps, 'min-w-[6.5rem] text-[0.66rem] tracking-[0.12em]')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_S = 30

// The API answers the same for known and unknown emails, so success here only
// means the request was accepted; a 429 means too many links were asked for.
const requestPasswordReset = async (email: string) => {
    const results = await handleForgotPassword(email.trim())
    if (!results.success) throw new Error(results.message)
}

export function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sentAt, setSentAt] = useState<number | null>(null)
    const now = useClock()

    const send = async () => {
        setError(null)
        if (!EMAIL_RE.test(email.trim())) {
            setError('Please provide a valid email address.')
            return
        }

        setIsLoading(true)
        try {
            await requestPasswordReset(email)
            setSentAt(Date.now())
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Could not send the reset link. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        void send()
    }

    const cooldown = sentAt ? Math.max(0, RESEND_COOLDOWN_S - Math.floor((now.getTime() - sentAt) / 1000)) : 0
    const date = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div className="flex min-h-dvh flex-col bg-background">
            <AuthTopbar tone="light" to="/auth/login" hint="Remembered it?" label="Log in" />

            <div className="grid flex-1 place-items-center px-4 pt-2 pb-12">
                <main className={cn('w-full max-w-[460px]', authRise)}>
                    <Eyebrow className="text-primary-light">Pharmacy · Account refill</Eyebrow>
                    <h1 className="m-0 text-[clamp(2.1rem,4.5vw,3.1rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-primary">
                        Lost your <Accent className="bg-highlight px-[0.1em]">key?</Accent>
                    </h1>
                    <p className="mx-0 mt-4 mb-8 max-w-[38ch] text-[1rem] leading-[1.6] text-copy-light">
                        No appointment needed. We’ll prescribe a fresh link so you can set a new password.
                    </p>

                    <div
                        className={cn(
                            'relative mx-0 mt-2 mb-5 rounded-t-[6px] rounded-b-md bg-ruled px-6 pt-9 pb-6 shadow-lg sm:px-8 sm:pt-10 sm:pb-7',
                            'transition-[rotate] duration-500 ease-out-expo motion-reduce:transition-none',
                            sentAt ? 'rotate-0' : 'rotate-[-1.5deg] focus-within:rotate-0',
                            // Pad binding
                            'before:absolute before:inset-x-0 before:top-0 before:h-[14px] before:rounded-t-[6px] before:bg-binding',
                            // Sheets underneath
                            'after:absolute after:inset-x-2 after:top-full after:h-[7px] after:rounded-b-md after:bg-[#efecf5] after:shadow-[0_6px_0_-1px_#e4e0ec]',
                        )}
                    >
                        <div className="mb-5 flex items-center gap-4 border-b-2 border-primary pb-4">
                            <span className="font-serif text-[2.75rem] italic leading-none text-primary" aria-hidden="true">
                                ℞
                            </span>
                            <div>
                                <strong className="block text-[1rem] text-primary">DocConnect Account Desk</strong>
                                <span className={cn(monoCaps, 'text-[0.66rem] tracking-[0.14em]')}>
                                    Password recovery · {date}
                                </span>
                            </div>
                        </div>

                        {error && <AuthAlert>{error}</AuthAlert>}

                        {sentAt ? (
                            <div className="py-2 text-center" role="status">
                                <span
                                    className="inline-block rounded-[6px] border-4 border-double border-secondary-dark px-4 py-[0.35rem] font-mono text-[1.15rem] font-extrabold uppercase tracking-[0.22em] text-lime-ink -rotate-8 animate-stamp motion-reduce:animate-none"
                                    aria-hidden="true"
                                >
                                    Dispensed
                                </span>
                                <h2 className="mx-0 mt-5 mb-2 inline-flex items-center gap-2 text-[1.25rem] text-primary">
                                    <LuMailCheck size={20} /> Check your inbox
                                </h2>
                                <p className="m-0 text-[0.92rem] leading-[1.55] text-copy-light">
                                    If an account exists for <strong>{maskEmail(email)}</strong>, a reset link is on its
                                    way. It works once, for 30 minutes. It can take a minute to arrive, so check spam
                                    too.
                                </p>

                                <div className="mt-6 flex flex-col items-center gap-2">
                                    <Link to="/auth/login" className={cn('btn btn-primary', authSubmit)}>
                                        Back to log in
                                        <LuArrowRight size={18} />
                                    </Link>
                                    <button
                                        type="button"
                                        className={cn(authLinkBtn, 'text-primary disabled:text-copy-lighter')}
                                        disabled={cooldown > 0 || isLoading}
                                        onClick={() => void send()}
                                    >
                                        {isLoading ? 'Resending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
                                    </button>
                                    <button
                                        type="button"
                                        className={cn(authLinkBtn, 'text-copy-lighter font-medium!')}
                                        onClick={() => setSentAt(null)}
                                    >
                                        Use a different email
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate>
                                <label htmlFor="email" className={authLabel}>
                                    Patient email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="you@example.com"
                                />

                                <ul className="mx-0 mt-5 mb-6 grid list-none p-0 text-[0.9rem]" aria-label="What happens next">
                                    <li className={doseRowClass}>
                                        <span className={doseKeyClass}>Dispense</span>1 reset link
                                    </li>
                                    <li className={doseRowClass}>
                                        <span className={doseKeyClass}>Directions</span>Open it from your inbox
                                    </li>
                                    <li className={doseRowClass}>
                                        <span className={doseKeyClass}>Refills</span>As needed
                                    </li>
                                </ul>

                                <button type="submit" disabled={isLoading} className={cn('btn btn-primary', authSubmit)}>
                                    {isLoading ? 'Writing it up…' : 'Send reset link'}
                                    {!isLoading && <LuArrowRight size={18} />}
                                </button>

                                <div className="mt-6 flex justify-end" aria-hidden="true">
                                    <div className="min-w-44 text-center">
                                        <em className="block border-b border-copy-lighter px-2 pt-0 pb-[0.1rem] font-script text-[1.5rem] text-primary-light -rotate-3">
                                            DocConnect
                                        </em>
                                        <span className={cn(monoCaps, 'mt-[0.35rem] block text-[0.6rem] tracking-[0.14em]')}>
                                            Authorised signature
                                        </span>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    <WebsiteLink to="/" className="mt-3 inline-block text-[0.85rem] text-copy-lighter">
                        &larr; Back to homepage
                    </WebsiteLink>
                </main>
            </div>
        </div>
    )
}

export default ForgotPassword

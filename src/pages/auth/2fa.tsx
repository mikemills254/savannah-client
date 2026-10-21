import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LuArrowRight } from 'react-icons/lu'
import { useClock } from '../../hooks/useClock.ts'
import { useHomePath } from '../../hooks/useHomePath.ts'
import { maskEmail } from './utils.ts'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { AuthAlert, AuthTopbar, WebsiteLink } from './ui.tsx'
import { authLinkBtn, authRise, authSubmit } from './styles.ts'

const CODE_LENGTH = 6
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CODE_TTL_MS = 5 * 60_000
const RESEND_AFTER_MS = 30_000
const RING_C = 2 * Math.PI * 16

type Status = 'idle' | 'verifying' | 'verified'

// TODO: wire to the backend once it exposes 2FA endpoints.
// The API has no verify/resend routes yet, so these only simulate the requests.
const verifyCode = () => new Promise<void>((resolve) => window.setTimeout(resolve, 900))
const resendCode = () => new Promise<void>((resolve) => window.setTimeout(resolve, 600))

const emptyCode = () => Array<string>(CODE_LENGTH).fill('')

// Shared full-width submit, with the larger top gap this layout uses
const otpSubmit = cn('btn btn-accent', authSubmit.replace('mt-1', 'mt-6'))

export function TwoFactor() {
    const location = useLocation()
    const email = (location.state as { email?: string } | null)?.email

    const [digits, setDigits] = useState<string[]>(emptyCode)
    const [status, setStatus] = useState<Status>('idle')
    const [error, setError] = useState<string | null>(null)
    const [shake, setShake] = useState(false)
    const [issuedAt, setIssuedAt] = useState(() => Date.now())
    const inputs = useRef<(HTMLInputElement | null)[]>([])
    const now = useClock()
    const home = useHomePath()

    const focusAt = (i: number) => inputs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))]?.focus()

    const verify = async (code: string) => {
        if (code.length !== CODE_LENGTH) {
            setError(`Enter all ${CODE_LENGTH} digits.`)
            setShake(true)
            return
        }
        setError(null)
        setStatus('verifying')
        try {
            await verifyCode()
            setStatus('verified')
        } catch (err: unknown) {
            setStatus('idle')
            setError(err instanceof Error ? err.message : 'That code didn’t match. Try again.')
            setShake(true)
            setDigits(emptyCode())
            focusAt(0)
        }
    }

    // Writes one or more digits starting at `start` (typing, paste, or OTP autofill)
    const fill = (start: number, value: string) => {
        const chars = value.replace(/\D/g, '').slice(0, CODE_LENGTH - start).split('')
        if (chars.length === 0) return
        const next = [...digits]
        chars.forEach((c, k) => {
            next[start + k] = c
        })
        setDigits(next)
        setError(null)
        focusAt(start + chars.length)
        if (next.every(Boolean)) void verify(next.join(''))
    }

    const clearAt = (i: number) => {
        const next = [...digits]
        next[i] = ''
        setDigits(next)
    }

    const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) {
            e.preventDefault()
            clearAt(i - 1)
            focusAt(i - 1)
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            focusAt(i - 1)
        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            focusAt(i + 1)
        }
    }

    const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        fill(i, e.clipboardData.getData('text'))
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        void verify(digits.join(''))
    }

    const handleResend = async () => {
        await resendCode()
        setIssuedAt(now.getTime())
        setDigits(emptyCode())
        setError(null)
        focusAt(0)
    }

    const elapsed = now.getTime() - issuedAt
    const remaining = Math.max(0, CODE_TTL_MS - elapsed)
    const canResend = elapsed >= RESEND_AFTER_MS
    const mm = Math.floor(remaining / 60_000)
    const ss = String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0')
    const verified = status === 'verified'

    return (
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-night text-white before:pointer-events-none before:absolute before:inset-0 before:bg-dots before:fade-down">
            <AuthTopbar tone="dark" to="/auth/login" hint="Not you?" label="Log in again" />

            <div className="relative z-1 grid flex-1 place-items-center px-4 pt-4 pb-8">
                <main className={cn('w-full max-w-[520px] text-center', authRise)}>
                    <Eyebrow className="justify-center text-secondary">Security · Second check</Eyebrow>
                    <h1 className="m-0 text-[clamp(2.4rem,8vw,4rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-white">
                        {verified ? (
                            <>
                                All <Accent className="text-secondary">clear.</Accent>
                            </>
                        ) : (
                            <>
                                One more <Accent className="text-secondary">check-up.</Accent>
                            </>
                        )}
                    </h1>
                    <p className="mx-auto mt-5 mb-0 max-w-[34ch] text-[1.05rem] leading-[1.6] text-white/70">
                        {verified ? (
                            'Your identity is confirmed. You’re good to go.'
                        ) : email ? (
                            <>
                                Enter the {CODE_LENGTH}-digit code we sent to{' '}
                                <span className="font-semibold text-white">{maskEmail(email)}</span>.
                            </>
                        ) : (
                            `Enter the ${CODE_LENGTH}-digit code from your email or authenticator app.`
                        )}
                    </p>

                    <form onSubmit={handleSubmit}>
                        <fieldset
                            className={cn(
                                'm-0 mt-9 grid grid-cols-6 gap-[0.45rem] rounded-[22px] border border-white/8 bg-ink p-[0.85rem] shadow-board min-[480px]:gap-3 min-[480px]:px-5 min-[480px]:py-[1.15rem]',
                                shake && 'animate-shake motion-reduce:animate-none',
                            )}
                            onAnimationEnd={() => setShake(false)}
                            disabled={status !== 'idle'}
                        >
                            <legend className="sr-only">Verification code</legend>
                            {digits.map((d, i) => (
                                <label key={i} className="flex min-w-0 flex-col gap-[0.4rem]">
                                    <span
                                        className={cn(
                                            'font-mono text-[0.6rem] tracking-[0.14em] uppercase transition-colors duration-200',
                                            d ? 'text-secondary' : 'text-white/40',
                                        )}
                                        aria-hidden="true"
                                    >
                                        {DAYS[i]}
                                    </span>
                                    <input
                                        ref={(el) => {
                                            inputs.current[i] = el
                                        }}
                                        value={d}
                                        onChange={(e) => (e.target.value ? fill(i, e.target.value) : clearAt(i))}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        onPaste={(e) => handlePaste(i, e)}
                                        onFocus={(e) => e.target.select()}
                                        inputMode="numeric"
                                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                        autoFocus={i === 0}
                                        aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                                        className={cn(
                                            'aspect-3/4 w-full min-w-0 rounded-[12px] border-[1.5px] p-0 text-center font-mono text-[clamp(1.3rem,5vw,1.9rem)] font-bold caret-secondary [transition:background_0.25s_ease,border-color_0.25s_ease,color_0.25s_ease,box-shadow_0.25s_ease,scale_0.3s_cubic-bezier(0.34,1.56,0.64,1)] focus:shadow-[0_0_0_4px_rgba(186,218,85,0.18)] focus:outline-none disabled:cursor-default motion-reduce:transition-none',
                                            error ? 'border-error' : d ? 'border-secondary' : 'border-white/12 focus:border-secondary',
                                            // The "pill" drops into its compartment
                                            d
                                                ? 'scale-94 bg-secondary text-secondary-content shadow-[inset_0_-6px_0_rgba(28,36,6,0.14)]'
                                                : 'bg-white/4 text-white',
                                        )}
                                    />
                                </label>
                            ))}
                        </fieldset>

                        {error && (
                            <AuthAlert tone="dark" className="mt-4">
                                {error}
                            </AuthAlert>
                        )}

                        {verified ? (
                            <Link to={home} className={otpSubmit}>
                                Continue to dashboard
                                <LuArrowRight size={18} />
                            </Link>
                        ) : (
                            <>
                                <div className="mt-5 flex items-center justify-between gap-4 text-[0.875rem] text-white/65">
                                    <span className="inline-flex items-center gap-[0.6rem] tabular-nums">
                                        <svg
                                            width="36"
                                            height="36"
                                            viewBox="0 0 36 36"
                                            aria-hidden="true"
                                            className="-rotate-90"
                                        >
                                            <circle
                                                className="fill-none stroke-white/12 [stroke-width:3]"
                                                cx="18"
                                                cy="18"
                                                r="16"
                                            />
                                            <circle
                                                className={cn(
                                                    'fill-none [stroke-linecap:round] [stroke-width:3] [transition:stroke-dashoffset_1s_linear,stroke_0.3s_ease]',
                                                    remaining < 60_000 ? 'stroke-warning' : 'stroke-secondary',
                                                )}
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                strokeDasharray={RING_C}
                                                strokeDashoffset={RING_C * (1 - remaining / CODE_TTL_MS)}
                                            />
                                        </svg>
                                        {remaining > 0 ? `Expires in ${mm}:${ss}` : 'Code expired'}
                                    </span>
                                    <button
                                        type="button"
                                        className={cn(authLinkBtn, 'text-secondary disabled:text-white/35')}
                                        disabled={!canResend}
                                        onClick={() => void handleResend()}
                                    >
                                        {canResend
                                            ? 'Resend code'
                                            : `Resend in ${Math.ceil((RESEND_AFTER_MS - elapsed) / 1000)}s`}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status !== 'idle' || remaining === 0}
                                    className={otpSubmit}
                                >
                                    {status === 'verifying' ? 'Checking…' : 'Verify'}
                                    {status !== 'verifying' && <LuArrowRight size={18} />}
                                </button>
                            </>
                        )}
                    </form>
                </main>
            </div>

            <footer className="relative z-1 px-4 pb-6 text-center">
                <WebsiteLink to="/" className="text-[0.85rem] text-white/55 transition-colors duration-200 hover:text-white">
                    &larr; Back to homepage
                </WebsiteLink>
            </footer>
        </div>
    )
}

export default TwoFactor

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useFormik, type FormikErrors } from 'formik'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { LuArrowRight } from 'react-icons/lu'
import { PasswordInput } from './PasswordInput.tsx'
import { useClock } from '../../hooks/useClock.ts'
import { hashString } from './utils.ts'
import { barcode } from '../../lib/barcode.ts'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { AuthAlert, AuthTopbar } from './ui.tsx'
import { authFieldError, authInlineLink, authInput, authLabel, authRise, authSubmit } from './styles.ts'
import type { ILogin } from '../../types/auth.types.ts'

// --- Form validation (Formik) ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values: ILogin) {
    const errors: FormikErrors<ILogin> = {}

    const email = values.email.trim()
    if (!email) {
        errors.email = 'Please enter your email address.'
    } else if (!EMAIL_RE.test(email)) {
        errors.email = 'Enter a valid email address, like you@example.com.'
    }

    // No length rule here: a wrong password should come back from the server as "incorrect"
    if (!values.password) {
        errors.password = 'Please enter your password.'
    }

    return errors
}

export function Login() {
    const navigate = useNavigate()
    const login = useAuthStore((s) => s.login)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

    // Only redirect visitors who were already signed in; a successful submit navigates itself
    const [startedAuthed] = useState(isAuthenticated)
    const [error, setError] = useState<string | null>(null)
    const [shake, setShake] = useState(false)
    const [queueNo] = useState(() => 100 + Math.floor(Math.random() * 800))
    const now = useClock()

    const formik = useFormik<ILogin>({
        initialValues: { email: '', password: '' },
        validate,
        onSubmit: async (values) => {
            setError(null)
            try {
                await login({ email: values.email.trim(), password: values.password })
                navigate('/dashboard', { replace: true })
            } catch (err: unknown) {
                // Credential errors stay in the general alert, never under one field,
                // so the page doesn't reveal whether the email or the password was wrong
                setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.')
                setShake(true)
            }
        },
    })

    // Hooks above must always run, so this early return lives after them
    if (startedAuthed) {
        return <Navigate to="/dashboard" replace />
    }

    const { values, isSubmitting } = formik

    // An error only shows once its field has been touched (blurred or submit attempted)
    const fieldError = (field: keyof ILogin) => (formik.touched[field] ? formik.errors[field] : undefined)
    const emailError = fieldError('email')
    const passwordError = fieldError('password')

    const ticket = `A-${String(queueNo).padStart(3, '0')}`
    const serving = `A-${String(queueNo - 1).padStart(3, '0')}`
    const code = barcode(hashString(values.email.trim().toLowerCase() || ticket))
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    const date = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-night text-white before:pointer-events-none before:absolute before:inset-0 before:bg-dots before:fade-down">
            <AuthTopbar tone="dark" to="/register" hint="New patient?" label="Register" />

            <div className="relative z-1 mx-auto grid w-full max-w-270 flex-1 items-center gap-10 px-4 pt-4 pb-8 min-[960px]:grid-cols-[1.05fr_0.95fr] min-[960px]:gap-16 min-[960px]:px-8 min-[960px]:pb-12">
                <section>
                    <Eyebrow className="text-secondary">Reception · Check-in</Eyebrow>
                    <h1 className="m-0 text-[clamp(2.75rem,8vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-white">
                        You’re <Accent className="text-secondary">next.</Accent>
                    </h1>
                    <p className="m-0 mt-5 max-w-[34ch] text-[1.05rem] leading-[1.6] text-white/70">
                        Check in to see your upcoming visits, grab an open slot, or cancel when plans change.
                    </p>

                    <div
                        className="mt-11 hidden max-w-90 rounded-md border border-white/8 bg-ink px-[1.15rem] pt-3 pb-[0.9rem] font-mono shadow-board min-[960px]:block"
                        aria-hidden="true"
                    >
                        <div className="flex items-baseline justify-between py-[0.6rem] text-[0.7rem] tracking-[0.14em] text-white/45 uppercase [border-bottom:1px_dashed_rgba(255,255,255,0.1)]">
                            <span>Now serving</span>
                            <strong className="text-[1.4rem] font-semibold tracking-[0.08em] text-white/50">{serving}</strong>
                        </div>
                        <div className="flex items-baseline justify-between py-[0.6rem] text-[0.7rem] tracking-[0.14em] text-white/45 uppercase [border-bottom:1px_dashed_rgba(255,255,255,0.1)]">
                            <span className="inline-flex items-center gap-2 text-white/80 before:size-1.5 before:animate-blink before:rounded-full before:bg-secondary motion-reduce:before:animate-none">
                                Your number
                            </span>
                            <strong className="text-[1.4rem] font-semibold tracking-[0.08em] text-secondary text-shadow-[0_0_14px_rgba(186,218,85,0.55)]">
                                {ticket}
                            </strong>
                        </div>
                        <div className="flex justify-between pt-[0.7rem] text-[0.7rem] tracking-[0.14em] text-white/45 uppercase">
                            <span>Est. wait · 0 min</span>
                            <span className="tracking-widest text-white tabular-nums">{time}</span>
                        </div>
                    </div>
                </section>

                <div
                    className={cn(
                        'w-full max-w-105 justify-self-center text-copy drop-shadow-[0_24px_40px_rgba(0,0,0,0.35)] transition-[rotate] duration-500 ease-out-expo motion-reduce:transition-none min-[960px]:rotate-2 min-[960px]:justify-self-end min-[960px]:focus-within:rotate-0',
                        shake ? 'animate-shake motion-reduce:animate-none' : authRise,
                    )}
                    onAnimationEnd={() => setShake(false)}
                >
                    <div className="rounded-t-lg px-6 pt-6 pb-7 ticket-top sm:px-8 sm:pt-7 sm:pb-8">
                        <div
                            className="mb-5 flex justify-between gap-4 border-b border-border pb-[0.9rem] font-mono text-[0.7rem] tracking-[0.14em] text-copy-lighter uppercase"
                            aria-hidden="true"
                        >
                            <span>Admit one</span>
                            <span>{date}</span>
                        </div>

                        <h2 className="m-0 mb-1 text-[1.5rem] tracking-[-0.02em] text-primary">Patient check-in</h2>
                        <p className="m-0 mb-6 text-[0.92rem] text-copy-light">Use the email you registered with.</p>

                        {error && <AuthAlert>{error}</AuthAlert>}

                        <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-[1.1rem]">
                            <div>
                                <label htmlFor="email" className={authLabel}>
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    {...formik.getFieldProps('email')}
                                    className={authInput(!!emailError)}
                                    placeholder="you@example.com"
                                    aria-invalid={!!emailError}
                                    aria-describedby={emailError ? 'email-error' : undefined}
                                />
                                {emailError && (
                                    <p id="email-error" role="alert" className={authFieldError}>
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-baseline justify-between gap-4">
                                    <label htmlFor="password" className={authLabel}>
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="mb-[0.4rem] text-[0.8rem] font-semibold text-primary underline-offset-[3px] hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                {/* onBlur bubbles from the input; ignore focus moving to the show/hide button inside */}
                                <div
                                    onBlur={(e) => {
                                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                            formik.setFieldTouched('password', true)
                                        }
                                    }}
                                >
                                    <PasswordInput
                                        id="password"
                                        value={values.password}
                                        onChange={(v: string) => formik.setFieldValue('password', v)}
                                        autoComplete="current-password"
                                        placeholder="Your password"
                                        describedBy={passwordError ? 'password-error' : undefined}
                                    />
                                </div>
                                {passwordError && (
                                    <p id="password-error" role="alert" className={authFieldError}>
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            <button type="submit" disabled={isSubmitting} className={cn('btn btn-primary', authSubmit)}>
                                {isSubmitting ? 'Checking you in…' : 'Check in'}
                                {!isSubmitting && <LuArrowRight size={18} />}
                            </button>
                        </form>

                        <p className={cn('m-0 mt-5 text-center text-[0.9rem] text-copy-light', authInlineLink)}>
                            First visit? <Link to="/register">Create free account</Link>
                        </p>
                    </div>

                    <div
                        className="relative flex items-center justify-between gap-4 rounded-b-lg px-6 pt-[1.15rem] pb-5 text-secondary-content ticket-bottom [--ticket:var(--color-secondary)] before:absolute before:top-0 before:right-4.5 before:left-4.5 before:[border-top:2px_dashed_rgba(28,36,6,0.35)] sm:px-8"
                        aria-hidden="true"
                    >
                        <svg
                            className="block h-8.5 w-35 max-w-[50%]"
                            viewBox={`0 0 ${code.width} 30`}
                            preserveAspectRatio="none"
                        >
                            {code.bars.map((b) => (
                                <rect key={b.x} x={b.x} y={0} width={b.w} height={30} fill="currentColor" />
                            ))}
                        </svg>
                        <div className="text-right font-mono leading-[1.1]">
                            <span className="block text-[0.65rem] tracking-[0.16em] uppercase opacity-70">No.</span>
                            <strong className="text-[1.35rem] tracking-[0.06em]">{ticket}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="relative z-1 px-4 pb-6 text-center">
                <Link to="/" className="text-[0.85rem] text-white/55 transition-colors duration-200 hover:text-white">
                    &larr; Back to homepage
                </Link>
            </footer>
        </div>
    )
}

export default Login

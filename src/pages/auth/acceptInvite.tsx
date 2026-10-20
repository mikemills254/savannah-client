import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LuArrowRight } from 'react-icons/lu'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { UserRole } from '../../types/types.ts'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { PasswordInput } from './PasswordInput.tsx'
import { AuthAlert, AuthTopbar } from './ui.tsx'
import { authFieldError, authLabel, authRise, authSubmit } from './styles.ts'

const MIN_PASSWORD = 8

// Where an invite link lands: staff a clinic added, or a patient a clinic booked for.
// Setting a password claims the account and signs them in.
export function AcceptInvite() {
    const navigate = useNavigate()
    const acceptInvite = useAuthStore((s) => s.acceptInvite)
    const [params] = useSearchParams()
    const token = params.get('token') ?? ''

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [fieldError, setFieldError] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [shake, setShake] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (password.length < MIN_PASSWORD) return setFieldError(`Use at least ${MIN_PASSWORD} characters.`)
        if (password !== confirm) return setFieldError("The passwords don't match.")

        setFieldError(null)
        setError(null)
        setSubmitting(true)
        try {
            const user = await acceptInvite({ token, password })
            toast.success(
                user.role === UserRole.PATIENT ? 'Welcome! Your visits are waiting.' : `Welcome to ${user.facility?.name ?? 'the team'}!`,
            )
            navigate('/dashboard', { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'This invite could not be used.')
            setShake(true)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="relative flex min-h-dvh flex-col overflow-hidden bg-night text-white before:pointer-events-none before:absolute before:inset-0 before:bg-dots before:fade-down">
            <AuthTopbar tone="dark" to="/login" hint="Already set up?" label="Log in" />

            <div className="relative z-1 mx-auto grid w-full max-w-270 flex-1 items-center gap-10 px-4 pt-4 pb-8 min-[960px]:grid-cols-[1.05fr_0.95fr] min-[960px]:gap-16 min-[960px]:px-8 min-[960px]:pb-12">
                <section>
                    <Eyebrow className="text-secondary">Invitation</Eyebrow>
                    <h1 className="m-0 text-[clamp(2.75rem,8vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-white">
                        Your seat is <Accent className="text-secondary">saved.</Accent>
                    </h1>
                    <p className="m-0 mt-5 max-w-[36ch] text-[1.05rem] leading-[1.6] text-white/70">
                        A clinic set up your DocConnect account. Choose a password to claim it, and everything they
                        booked or shared is already there.
                    </p>
                </section>

                <div
                    className={cn(
                        'w-full max-w-105 justify-self-center text-copy drop-shadow-[0_24px_40px_rgba(0,0,0,0.35)] min-[960px]:justify-self-end',
                        shake ? 'animate-shake motion-reduce:animate-none' : authRise,
                    )}
                    onAnimationEnd={() => setShake(false)}
                >
                    <div className="rounded-t-lg px-6 pt-6 pb-7 ticket-top sm:px-8 sm:pt-7 sm:pb-8">
                        <div
                            className="mb-5 flex justify-between gap-4 border-b border-border pb-[0.9rem] font-mono text-[0.7rem] tracking-[0.14em] text-copy-lighter uppercase"
                            aria-hidden="true"
                        >
                            <span>Reserved</span>
                            <span>Admit one</span>
                        </div>

                        <h2 className="m-0 mb-1 text-[1.5rem] tracking-[-0.02em] text-primary">Set your password</h2>
                        <p className="m-0 mb-6 text-[0.92rem] text-copy-light">You'll use it with your email to log in.</p>

                        {!token ? (
                            <AuthAlert>
                                This invite link is incomplete. Open the full link you were sent, or ask the clinic for a
                                new one.
                            </AuthAlert>
                        ) : (
                            <>
                                {error && <AuthAlert>{error}</AuthAlert>}

                                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[1.1rem]">
                                    <div>
                                        <label htmlFor="password" className={authLabel}>
                                            New password
                                        </label>
                                        <PasswordInput
                                            id="password"
                                            value={password}
                                            onChange={setPassword}
                                            autoComplete="new-password"
                                            placeholder={`At least ${MIN_PASSWORD} characters`}
                                            minLength={MIN_PASSWORD}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirm" className={authLabel}>
                                            Confirm password
                                        </label>
                                        <PasswordInput
                                            id="confirm"
                                            value={confirm}
                                            onChange={setConfirm}
                                            autoComplete="new-password"
                                            placeholder="Type it again"
                                            describedBy={fieldError ? 'password-error' : undefined}
                                        />
                                        {fieldError && (
                                            <p id="password-error" role="alert" className={authFieldError}>
                                                {fieldError}
                                            </p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={submitting} className={cn('btn btn-primary', authSubmit)}>
                                        {submitting ? 'Claiming your account…' : 'Claim my account'}
                                        {!submitting && <LuArrowRight size={18} />}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    <div
                        className="relative rounded-b-lg px-6 pt-[1.15rem] pb-5 text-center font-mono text-[0.7rem] tracking-[0.14em] text-secondary-content uppercase ticket-bottom [--ticket:var(--color-secondary)] before:absolute before:top-0 before:right-4.5 before:left-4.5 before:[border-top:2px_dashed_rgba(28,36,6,0.35)] sm:px-8"
                        aria-hidden="true"
                    >
                        Links work once, for 72 hours
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

export default AcceptInvite

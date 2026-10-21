import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useClock } from '../../hooks/useClock.ts'
import { Logo } from '../../website/components/Logo.tsx'
import { LuArrowRight, LuCheck } from 'react-icons/lu'
import { PasswordInput } from './PasswordInput.tsx'
import { hashString } from './utils.ts'
import { AuthAlert, AuthTopbar } from './ui.tsx'
import {
    authFieldError as fieldErrorClass,
    authInlineLink,
    authInput as inputClass,
    authLabel,
    authRise,
    authSubmit,
} from './styles.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { cn } from '../../lib/cn.ts'
import { useFormik, type FormikErrors } from 'formik'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { HomeRedirect } from '../../components/layout/privateRoutes.tsx'
import GoogleSignIn from '../../components/googleSignIn.tsx'
import { homePath } from '../../lib/homePath.ts'
import type { IRegister } from '../../types/auth.types.ts'

// --- Class strings ---

const titleClass = 'm-0 text-[clamp(2.1rem,4.5vw,3.1rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-primary'
const ledeClass = 'mx-0 mt-4 mb-8 max-w-[38ch] text-[1rem] leading-[1.6] text-copy-light'
const hintClass = 'mx-0 mt-[0.35rem] mb-0 text-[0.8rem] text-copy-lighter'
const switchClass = cn('mx-0 mb-0 text-copy-light', authInlineLink)

// Numbered step: the connector line hides on the last step and turns lime once done
const stepBase =
    'relative pl-[2.85rem] after:absolute after:top-[1.95rem] after:-bottom-6 after:left-[calc(1rem-1px)] after:w-0.5 after:transition-colors after:duration-300 last-of-type:after:hidden'
const stepNumBase =
    'absolute -top-[0.3rem] left-0 grid size-8 place-items-center rounded-full border-[1.5px] font-mono text-[0.72rem] font-bold transition-[background,border-color,color,scale] duration-300'

// Preview card (patient + clinic share the frame)
const cardClass = (clinic: boolean, ready: boolean) =>
    cn(
        'relative flex aspect-[1.586] w-full max-w-[380px] flex-col justify-between overflow-hidden rounded-[18px] px-[1.35rem] pt-[1.15rem] pb-[1.35rem] text-white',
        'shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)]',
        'transition-[rotate,scale] duration-[600ms] ease-out-expo motion-reduce:transition-none',
        // Sheen sweep
        'before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-sheen before:animate-sheen motion-reduce:before:animate-none',
        // Coloured band along the bottom edge
        'after:absolute after:inset-x-0 after:bottom-0 after:h-[5px]',
        clinic ? 'bg-card-clinic after:bg-primary' : 'bg-card-patient after:bg-secondary',
        ready ? 'rotate-0 scale-103' : '-rotate-4',
    )
const cardStampClass = (ready: boolean) =>
    cn(
        'absolute right-4 bottom-[1.35rem] rounded-[6px] border-2 border-secondary bg-[rgba(35,18,64,0.75)] px-[0.6rem] py-[0.3rem] font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-secondary -rotate-10',
        'transition-[opacity,scale] duration-[250ms,350ms] ease-[ease,cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
        ready ? 'scale-100 opacity-100' : 'scale-180 opacity-0',
    )
const cardTopClass = 'flex items-center justify-between gap-3'
const cardSmallClass = 'font-mono text-[0.6rem] uppercase tracking-[0.16em] text-white/60'
const cardWhoClass = 'flex min-w-0 items-center gap-[0.85rem]'
const cardAvatarClass =
    'grid size-[2.9rem] shrink-0 place-items-center rounded-full text-[1rem] font-extrabold tracking-[0.02em]'
const cardNameClass = 'overflow-hidden text-ellipsis whitespace-nowrap text-[1.2rem] font-bold tracking-[-0.01em]'
const cardEmailClass = 'overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[0.75rem] text-white/70'
const cardMetaClass = 'flex gap-7'
const cardMetaValueClass = 'block font-mono text-[0.85rem] font-semibold tracking-[0.08em]'
const cardEmpty = 'opacity-40'

// --- UI-only helpers (presentation, no auth logic) ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --- Form values + validation (Formik) ---

// Form fields are always strings; the IRegister payload sends null for the facility fields on a patient sign-up
type RegisterValues = Omit<IRegister, 'facilityName' | 'timezone'> & {
    facilityName: string
    timezone: string
}

function validate(values: RegisterValues, isClinic: boolean) {
    const errors: FormikErrors<RegisterValues> = {}

    if (!values.name.trim()) {
        errors.name = 'Please provide your full name.'
    }

    const email = values.email.trim()
    if (!email) {
        errors.email = 'Please provide your email address.'
    } else if (!EMAIL_RE.test(email)) {
        errors.email = 'Enter a valid email address, like you@example.com.'
    }

    if (isClinic && !values.facilityName?.trim()) {
        errors.facilityName = 'Please provide your facility’s name.'
    }

    if (isClinic && !values.timezone) {
        errors.timezone = 'Please select your clinic’s time zone.'
    }

    if (!values.password) {
        errors.password = 'Please create a password.'
    } else if (values.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.'
    }

    return errors
}

type PulseLevel = 0 | 1 | 2 | 3

const PULSE_LABELS: Record<PulseLevel, string> = {
    0: 'Flatline',
    1: 'Weak pulse',
    2: 'Steady',
    3: 'Strong',
}

// Beat amplitudes per strength level; the weak pulse is deliberately irregular
const PULSE_AMPLITUDES: Record<PulseLevel, number[]> = {
    0: [0, 0, 0, 0],
    1: [0.35, 0.12, 0.42, 0.08],
    2: [0.65, 0.65, 0.65, 0.65],
    3: [1, 1, 1, 1],
}

// Trace + label colour per strength level
const PULSE_TONES: Record<PulseLevel, { stroke: string; text: string }> = {
    0: { stroke: 'stroke-border', text: 'text-copy-lighter' },
    1: { stroke: 'stroke-error', text: 'text-error-ink' },
    2: { stroke: 'stroke-[#e0ad1a]', text: 'text-[#8a6a0a]' },
    3: { stroke: 'stroke-secondary-dark', text: 'text-lime-ink' },
}

function pulseLevel(pw: string): PulseLevel {
    if (!pw) return 0
    if (pw.length < 8) return 1
    const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
    return variety >= 3 || pw.length >= 14 ? 3 : 2
}

// Eight 100-unit heartbeats; the track scrolls by half, so the loop is seamless
function ecgPath(level: PulseLevel) {
    const amps = PULSE_AMPLITUDES[level]
    let d = 'M0 20'
    for (let i = 0; i < 8; i++) {
        const x = i * 100
        const a = amps[i % amps.length]
        const y = (h: number) => (20 - h * a).toFixed(1)
        d += ` L${x + 28} 20 Q${x + 33} ${y(4)} ${x + 38} 20 L${x + 44} 20 L${x + 47} ${y(-4)} L${x + 51} ${y(16)} L${x + 55} ${y(-7)} L${x + 58} 20 Q${x + 67} ${y(6)} ${x + 76} 20 L${x + 100} 20`
    }
    return d
}

function initialsOf(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    const first = parts[0][0]
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase()
}

function cardId(prefix: string, seed: string) {
    if (!seed.trim()) return `${prefix}-0000-0000`
    const h = hashString(seed.trim().toLowerCase())
    const a = String(h % 10000).padStart(4, '0')
    const b = String(Math.floor(h / 10000) % 10000).padStart(4, '0')
    return `${prefix}-${a}-${b}`
}

const FALLBACK_ZONES = ['Africa/Nairobi', 'Africa/Lagos', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'Asia/Dubai']

function timeZones(): string[] {
    const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
    return supported ? supported('timeZone') : FALLBACK_ZONES
}

function localTime(now: Date, timeZone: string) {
    try {
        return new Intl.DateTimeFormat([], { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
    } catch {
        return '--:--'
    }
}

export function Register() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const isClinic = params.get('as') === 'clinic'
    const register = useAuthStore((s) => s.register)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

    // Only redirect visitors who were already signed in; a successful submit navigates itself
    const [startedAuthed] = useState(isAuthenticated)
    const [defaultZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
    const [zones] = useState(timeZones)
    const [error, setError] = useState<string | null>(null)
    const now = useClock()

    const formik = useFormik<RegisterValues>({
        initialValues: {
            name: '',
            email: '',
            password: '',
            facilityName: '',
            timezone: defaultZone,
        },
        validate: (values) => validate(values, isClinic),
        onSubmit: async (values, helpers) => {
            setError(null)
            const email = values.email.trim()

            // Required clinic fields are already checked by validate(); Formik won't submit until they pass.
            // Only a clinic sign-up sends facility details, which makes the server create the facility too.
            const payload: IRegister = {
                name: values.name.trim(),
                email,
                password: values.password,
                facilityName: isClinic ? values.facilityName.trim() : null,
                timezone: isClinic ? values.timezone : null,
            }

            try {
                // Sign-up also logs in, so go straight to the new user's home
                const user = await register(payload)
                navigate(homePath(user), { replace: true })
            } catch (err: unknown) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Registration could not be completed. Please check your information.'
                // Server errors about the email (e.g. already registered) belong under the email field
                if (/e-?mail/i.test(message)) {
                    helpers.setFieldError('email', message)
                } else {
                    setError(message)
                }
            }
        },
    })

    // Hooks above must always run, so this early return lives after them
    if (startedAuthed) {
        return <HomeRedirect />
    }

    const { values, isSubmitting } = formik

    // An error only shows once its field has been touched (blurred or submit attempted)
    const fieldError = (field: keyof RegisterValues) =>
        formik.touched[field] ? formik.errors[field] : undefined
    const nameError = fieldError('name')
    const emailError = fieldError('email')
    const clinicNameError = fieldError('facilityName')
    const timezoneError = fieldError('timezone')
    const passwordError = fieldError('password')

    const nameDone = values.name.trim().length > 0
    const emailDone = EMAIL_RE.test(values.email.trim())
    const clinicDone = values.facilityName.trim().length > 0
    const passwordDone = values.password.length >= 8
    const ready = nameDone && emailDone && passwordDone && (!isClinic || clinicDone)
    const level = pulseLevel(values.password)
    const since = now.toLocaleDateString([], { month: 'short', year: '2-digit' }).toUpperCase()

    const stepClass = (done: boolean) => cn(stepBase, done ? 'after:bg-secondary' : 'after:bg-border')
    const stepNum = (done: boolean, n: string) => (
        <span
            className={cn(
                stepNumBase,
                done
                    ? 'scale-105 border-secondary bg-secondary text-secondary-content'
                    : 'border-border bg-white text-copy-lighter',
            )}
            aria-hidden="true"
        >
            {done ? <LuCheck size={14} strokeWidth={3} /> : n}
        </span>
    )
    const n = (i: number) => String(i).padStart(2, '0')

    return (
        <div className="flex min-h-dvh flex-col bg-background">
            {isClinic ? (
                <AuthTopbar tone="light" to="/auth/register" hint="Booking for yourself?" label="Patient sign-up" />
            ) : (
                <AuthTopbar tone="light" to="/auth/login" hint="Already a patient?" label="Log in" />
            )}

            <div className="mx-auto grid w-full max-w-295 flex-1 gap-8 px-4 pt-1 pb-10 min-[960px]:grid-cols-2 min-[960px]:gap-14 min-[960px]:px-8 min-[960px]:pb-8">
                <main
                    className={cn(
                        'order-2 w-full max-w-110 self-center justify-self-center min-[960px]:order-0',
                        authRise,
                    )}
                >
                        <>
                            <Eyebrow className="text-primary-light">
                                {isClinic ? 'Clinic sign-up' : 'New patient intake'}
                            </Eyebrow>
                            <h1 className={titleClass}>
                                {isClinic ? (
                                    <>
                                        Put your clinic <Accent className="bg-highlight px-[0.1em]">on the map.</Accent>
                                    </>
                                ) : (
                                    <>
                                        Let’s print your patient <Accent className="bg-highlight px-[0.1em]">card.</Accent>
                                    </>
                                )}
                            </h1>
                            <p className={ledeClass}>
                                {isClinic
                                    ? 'Create your admin account and set up your clinic. You can add doctors as soon as you’re in.'
                                    : 'Three quick details. Watch your card fill in, then book any open slot at any clinic.'}
                            </p>

                            {error && <AuthAlert>{error}</AuthAlert>}

                            <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-[1.35rem]">
                                <div className={stepClass(nameDone)}>
                                    {stepNum(nameDone, n(1))}
                                    <label htmlFor="name" className={authLabel}>
                                        {isClinic ? 'Your full name' : 'Full name'}
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        {...formik.getFieldProps('name')}
                                        className={inputClass(!!nameError)}
                                        placeholder={isClinic ? 'Dr. Jane Doe' : 'Jane Doe'}
                                        aria-invalid={!!nameError}
                                        aria-describedby={nameError ? 'name-error' : undefined}
                                    />
                                    {nameError && (
                                        <p id="name-error" role="alert" className={fieldErrorClass}>
                                            {nameError}
                                        </p>
                                    )}
                                </div>

                                <div className={stepClass(emailDone)}>
                                    {stepNum(emailDone, n(2))}
                                    <label htmlFor="email" className={authLabel}>
                                        {isClinic ? 'Work email' : 'Email address'}
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        {...formik.getFieldProps('email')}
                                        className={inputClass(!!emailError)}
                                        placeholder={isClinic ? 'admin@yourclinic.com' : 'you@example.com'}
                                        aria-invalid={!!emailError}
                                        aria-describedby={emailError ? 'email-error' : undefined}
                                    />
                                    {emailError && (
                                        <p id="email-error" role="alert" className={fieldErrorClass}>
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                {isClinic && (
                                    <>
                                        <div className={stepClass(clinicDone)}>
                                            {stepNum(clinicDone, n(3))}
                                            <label htmlFor="clinicName" className={authLabel}>
                                                Clinic name
                                            </label>
                                            <input
                                                id="clinicName"
                                                type="text"
                                                autoComplete="organization"
                                                required
                                                maxLength={150}
                                                {...formik.getFieldProps('facilityName')}
                                                className={inputClass(!!clinicNameError)}
                                                placeholder="St. Jude Health Center"
                                                aria-invalid={!!clinicNameError}
                                                aria-describedby={clinicNameError ? 'clinicName-error' : undefined}
                                            />
                                            {clinicNameError && (
                                                <p id="clinicName-error" role="alert" className={fieldErrorClass}>
                                                    {clinicNameError}
                                                </p>
                                            )}
                                        </div>

                                        <div className={stepClass(Boolean(values.timezone))}>
                                            {stepNum(Boolean(values.timezone), n(4))}
                                            <label htmlFor="timezone" className={authLabel}>
                                                Clinic time zone
                                            </label>
                                            <select
                                                id="timezone"
                                                {...formik.getFieldProps('timezone')}
                                                className={inputClass(!!timezoneError, 'select-chevron')}
                                                aria-invalid={!!timezoneError}
                                                aria-describedby={
                                                    timezoneError ? 'timezone-error timezone-hint' : 'timezone-hint'
                                                }
                                            >
                                                {zones.map((z) => (
                                                    <option key={z} value={z}>
                                                        {z.replace(/_/g, ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            {timezoneError && (
                                                <p id="timezone-error" role="alert" className={fieldErrorClass}>
                                                    {timezoneError}
                                                </p>
                                            )}
                                            <p id="timezone-hint" className={hintClass}>
                                                It’s {localTime(now, values.timezone)} there now. Bookings and doctor hours use
                                                this time zone.
                                            </p>
                                        </div>
                                    </>
                                )}

                                <div className={stepClass(passwordDone)}>
                                    {stepNum(passwordDone, n(isClinic ? 5 : 3))}
                                    <label htmlFor="password" className={authLabel}>
                                        Password
                                    </label>
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
                                            autoComplete="new-password"
                                            placeholder="At least 8 characters"
                                            minLength={8}
                                            describedBy={passwordError ? 'password-error password-pulse' : 'password-pulse'}
                                        />
                                    </div>
                                    {passwordError && (
                                        <p id="password-error" role="alert" className={fieldErrorClass}>
                                            {passwordError}
                                        </p>
                                    )}
                                    <div className="mt-[0.6rem] flex items-center gap-3" data-level={level}>
                                        <div
                                            className="h-8 flex-1 overflow-hidden rounded-[4px] bg-ecg-grid fade-x"
                                            aria-hidden="true"
                                        >
                                            <div className="h-full w-[200%] animate-ecg motion-reduce:animate-none">
                                                <svg
                                                    viewBox="0 0 800 40"
                                                    preserveAspectRatio="none"
                                                    className="block size-full"
                                                >
                                                    <path
                                                        d={ecgPath(level)}
                                                        strokeWidth={2}
                                                        strokeLinejoin="round"
                                                        vectorEffect="non-scaling-stroke"
                                                        className={cn(
                                                            'fill-none transition-[stroke] duration-300',
                                                            PULSE_TONES[level].stroke,
                                                        )}
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        <span
                                            id="password-pulse"
                                            className={cn(
                                                'min-w-26 whitespace-nowrap text-right font-mono text-[0.7rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-300',
                                                PULSE_TONES[level].text,
                                            )}
                                            aria-live="polite"
                                        >
                                            {PULSE_LABELS[level]}
                                        </span>
                                    </div>
                                    <p className={hintClass}>
                                        8+ characters. Mix in capitals, numbers or symbols for a strong pulse.
                                    </p>
                                </div>

                                <button type="submit" disabled={isSubmitting} className={cn('btn btn-primary', authSubmit)}>
                                    {isSubmitting
                                        ? isClinic
                                            ? 'Setting up your clinic…'
                                            : 'Printing your card…'
                                        : isClinic
                                          ? 'Create clinic'
                                          : 'Create free account'}
                                    {!isSubmitting && <LuArrowRight size={18} />}
                                </button>
                            </form>

                            {/* Google creates patient accounts only, so clinics sign up with the form */}
                            {!isClinic && (
                                <GoogleSignIn
                                    text="signup_with"
                                    onSignedIn={(user) => navigate(homePath(user), { replace: true })}
                                    onError={setError}
                                />
                            )}

                            <p className={cn(switchClass, 'mt-6 text-[0.9rem]')}>
                                Already have an account? <Link to="/auth/login">Log in</Link>
                            </p>
                            {isClinic ? (
                                <Link to="/for-clinics" className="mt-3 inline-block text-[0.85rem] text-copy-lighter">
                                    &larr; How it works for clinics
                                </Link>
                            ) : (
                                <p className={cn(switchClass, 'mt-2 text-[0.85rem]')}>
                                    Run a clinic? <Link to="/auth/register?as=clinic">Create a clinic space</Link>
                                </p>
                            )}
                        </>
                </main>

                <aside
                    className={cn(
                        'relative isolate flex min-h-65 flex-col items-center justify-center gap-6 overflow-hidden rounded-lg bg-primary-dark px-5 py-8 min-[960px]:px-10 min-[960px]:py-12',
                        // Lime glow, top right
                        'before:absolute before:-top-32 before:-right-24 before:-z-1 before:size-96 before:rounded-full before:bg-secondary before:opacity-30 before:blur-[90px]',
                        // Dot grid, faded towards the edges
                        'after:absolute after:inset-0 after:-z-1 after:bg-dots after:fade-radial after:[--dot-size:20px] after:[--dot:rgba(255,255,255,0.08)]',
                    )}
                    aria-hidden="true"
                >
                    {isClinic ? (
                        <div className={cardClass(true, ready)}>
                            <div className={cardTopClass}>
                                <Logo variant="horizontal" theme="white" height={22} alt="" />
                                <span className={cardSmallClass}>Clinic licence</span>
                            </div>

                            <div className={cardWhoClass}>
                                <div className={cn(cardAvatarClass, 'bg-white text-[#2c3a08]')}>
                                    {initialsOf(values.facilityName)}
                                </div>
                                <div className="min-w-0">
                                    <div className={cn(cardNameClass, !clinicDone && cardEmpty)}>
                                        {values.facilityName.trim() || 'Your clinic'}
                                    </div>
                                    <div className={cardEmailClass}>
                                        {values.timezone.replace(/_/g, ' ')} · {localTime(now, values.timezone)}
                                    </div>
                                </div>
                            </div>

                            <div className={cardMetaClass}>
                                <div>
                                    <span className={cardSmallClass}>Admin</span>
                                    <strong className={cn(cardMetaValueClass, !nameDone && cardEmpty)}>
                                        {values.name.trim() || 'You'}
                                    </strong>
                                </div>
                                <div>
                                    <span className={cardSmallClass}>Ref</span>
                                    <strong className={cardMetaValueClass}>{cardId('CL', values.facilityName)}</strong>
                                </div>
                            </div>

                            <span className={cardStampClass(ready)}>
                                Ready to open
                            </span>
                        </div>
                    ) : (
                        <div className={cardClass(false, ready)}>
                            <div className={cardTopClass}>
                                <Logo variant="horizontal" theme="white" height={22} alt="" />
                                <span className={cardSmallClass}>Patient card</span>
                            </div>

                            <div className={cardWhoClass}>
                                <div className={cn(cardAvatarClass, 'bg-secondary text-secondary-content')}>
                                    {initialsOf(values.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className={cn(cardNameClass, !nameDone && cardEmpty)}>
                                        {values.name.trim() || 'Your name'}
                                    </div>
                                    <div className={cn(cardEmailClass, !values.email && cardEmpty)}>
                                        {values.email.trim() || 'you@example.com'}
                                    </div>
                                </div>
                            </div>

                            <div className={cardMetaClass}>
                                <div>
                                    <span className={cardSmallClass}>Patient ID</span>
                                    <strong className={cardMetaValueClass}>{cardId('DC', values.name)}</strong>
                                </div>
                                <div>
                                    <span className={cardSmallClass}>Since</span>
                                    <strong className={cardMetaValueClass}>{since}</strong>
                                </div>
                            </div>

                            <span className={cardStampClass(ready)}>Ready to book</span>
                        </div>
                    )}
                    <p className="m-0 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-white/55">
                        Live preview · fills in as you type
                    </p>
                </aside>
            </div>
        </div>
    )
}

export default Register
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { LuArrowRight, LuLock, LuShieldCheck } from 'react-icons/lu'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow, LiveBadge } from '../../components/ui.tsx'
import { heroAccent, heroActions, heroBtn, heroGrid, heroLede, heroSection, heroTitle } from '../components/sectionStyles.ts'

// --- Demo booker data (illustrative only, not live availability) ---

const DAYS = [
    { short: 'Mon', date: 14 },
    { short: 'Tue', date: 15 },
    { short: 'Wed', date: 16 },
    { short: 'Thu', date: 17 },
    { short: 'Fri', date: 18 },
]

const TIMES = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00']

// Deterministic "already booked" pattern so each day looks different
const isTaken = (day: number, slot: number) => (day * 4 + slot * 3) % 5 === 0 || (day + slot) % 7 === 0

const TICKER = [
    'No phone calls',
    'No hold music',
    'Real working hours',
    'Clinic local time',
    'No double-booking',
    'Cancel anytime',
]

const dayBtn =
    'group rounded-sm border border-border bg-white px-0 py-[0.45rem] font-mono text-[0.62rem] leading-[1.3] tracking-widest text-copy-lighter uppercase transition-colors duration-200 ease-[ease] hover:border-primary-light aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-white/70'

const slotBtn =
    'rounded-sm border px-0 py-[0.6rem] text-[0.875rem] font-semibold tabular-nums transition-[background,border-color,color,scale] duration-200 ease-[ease] enabled:hover:border-primary enabled:hover:text-primary enabled:active:scale-96 disabled:cursor-not-allowed disabled:bg-hatch disabled:text-copy-lighter disabled:line-through'

const footIcon = 'shrink-0 text-secondary-dark'

export function Hero() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const [day, setDay] = useState(1)
    const [slot, setSlot] = useState<number | null>(null)

    const pickDay = (i: number) => {
        setDay(i)
        setSlot(null)
    }

    return (
        <section className={heroSection} aria-labelledby="hero-heading">
            <div className="site-container">
                <div className={heroGrid}>
                    <div>
                        <Eyebrow mark="dot" className="text-primary-light">
                            Direct clinic &amp; hospital scheduling
                        </Eyebrow>
                        <h1 id="hero-heading" className={heroTitle}>
                            Your doctor has an open slot. <Accent className={heroAccent}>Take it.</Accent>
                        </h1>
                        <p className={heroLede}>
                            Pick a clinic, choose a doctor, and reserve a verified open slot in seconds. You only ever
                            see times when the doctor is truly in.
                        </p>
                        <p className="mt-5 mb-0 max-w-136 border-l-2 border-secondary pl-[0.85rem] text-[0.9375rem] leading-normal text-copy-lighter">
                            Clinics run their own team and doctor schedules on the platform, so every opening comes
                            straight from real working hours.
                        </p>

                        <div className={heroActions}>
                            {isAuthenticated ? (
                                <Link to="/dashboard" className={cn('btn btn-primary', heroBtn)}>
                                    Go to dashboard
                                    <LuArrowRight size={18} />
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className={cn('btn btn-primary', heroBtn)}>
                                        Create free account
                                        <LuArrowRight size={18} />
                                    </Link>
                                    <Link to="/login" className={cn('btn btn-secondary', heroBtn)}>
                                        Log in
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div
                        className="relative w-full max-w-110 justify-self-center rounded-lg border border-border bg-white p-6 shadow-lg"
                        role="group"
                        aria-label="Booking demo"
                    >
                        <span className="absolute top-[-0.8rem] left-5 -rotate-3 rounded-full bg-secondary px-[0.7rem] py-[0.3rem] font-mono text-[0.65rem] font-bold tracking-[0.12em] text-secondary-content uppercase">
                            Try it · demo
                        </span>

                        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                            <div>
                                <strong className="block text-[1rem] text-primary">Metro Health Center</strong>
                                <span className="font-mono text-[0.66rem] tracking-widest text-copy-lighter uppercase">
                                    Clinic time · GMT+3
                                </span>
                            </div>
                            <LiveBadge>Live slots</LiveBadge>
                        </div>

                        <div className="my-4 flex items-center gap-[0.85rem] rounded-sm bg-background p-[0.85rem]">
                            <span
                                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-[0.85rem] font-extrabold text-secondary"
                                aria-hidden="true"
                            >
                                SM
                            </span>
                            <div>
                                <strong className="block text-[0.95rem] text-copy">Dr. Sarah Miller, MD</strong>
                                <span className="text-[0.8rem] text-copy-light">General consultation · 30 min</span>
                            </div>
                        </div>

                        <div className="mb-3 grid grid-cols-5 gap-[0.4rem]">
                            {DAYS.map((d, i) => (
                                <button
                                    key={d.short}
                                    type="button"
                                    className={dayBtn}
                                    aria-pressed={day === i}
                                    onClick={() => pickDay(i)}
                                >
                                    {d.short}
                                    <strong className="block font-(family-name:--sans) text-[1rem] tracking-normal text-copy group-aria-pressed:text-white">
                                        {d.date}
                                    </strong>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-[0.45rem]">
                            {TIMES.map((t, i) => {
                                const taken = isTaken(day, i)
                                // Pressed styles are applied directly so hover still wins over them, as before
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        className={cn(
                                            slotBtn,
                                            slot === i
                                                ? 'border-secondary-dark bg-secondary text-secondary-content'
                                                : 'border-border bg-white text-copy',
                                        )}
                                        disabled={taken}
                                        aria-pressed={slot === i}
                                        aria-label={taken ? `${t}, already booked` : t}
                                        onClick={() => setSlot(i)}
                                    >
                                        {t}
                                    </button>
                                )
                            })}
                        </div>

                        <div
                            className="mt-4 flex min-h-[3.4rem] items-center gap-[0.6rem] border-0 border-t border-dashed border-border pt-[0.9rem] text-[0.82rem] text-copy-light"
                            aria-live="polite"
                        >
                            {slot === null ? (
                                <>
                                    <LuShieldCheck size={16} className={footIcon} />
                                    <span>Tap an open time. Struck-through slots are already taken.</span>
                                </>
                            ) : (
                                <div
                                    className="flex w-full animate-print items-center gap-[0.6rem] motion-reduce:animate-none"
                                    key={`${day}-${slot}`}
                                >
                                    <LuLock size={16} className={footIcon} />
                                    <span>
                                        <strong className="text-primary">Locked for you.</strong> No one else can take it.
                                    </span>
                                    <code className="ml-auto rounded-[6px] bg-accent-bg px-2 py-[0.2rem] font-mono text-[0.72rem] whitespace-nowrap text-primary">
                                        {DAYS[day].short} {TIMES[slot]}
                                    </code>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden bg-primary py-[0.95rem] text-white" aria-hidden="true">
                <div className="flex w-max animate-marquee motion-reduce:animate-none">
                    {[...TICKER, ...TICKER].map((item, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-7 pr-7 font-mono text-[0.78rem] tracking-[0.16em] whitespace-nowrap uppercase after:text-secondary after:content-['✚']"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Hero

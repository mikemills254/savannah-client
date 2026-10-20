import { useEffect, useRef, useState } from 'react'
import { LuCheck, LuRotateCcw } from 'react-icons/lu'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { Lede, SectionHeading } from '../components/section.tsx'
import { sectionPad } from '../components/sectionStyles.ts'

type Phase = 'idle' | 'booking' | 'done'

const PATIENTS = [
    { name: 'Amina', initials: 'AK' },
    { name: 'Brian', initials: 'BO' },
]

const NEXT_TIMES = ['11:00', '11:30', '14:00']

const FACTS = [
    { title: 'One slot, one patient', body: 'A time can only ever be held by one person, no matter how fast others tap.' },
    { title: 'No dead ends', body: 'If someone beats you to it, you see the next open times straight away.' },
    { title: 'Cancel and it’s back', body: 'When plans change, the slot goes straight back up for someone who needs it.' },
]

const phone =
    'w-full max-w-[260px] rounded-[36px] bg-ink-soft p-[0.55rem] shadow-[0_16px_36px_rgba(35,18,64,0.12),inset_0_0_0_2px_rgba(255,255,255,0.08)]'

const result =
    'grid animate-print gap-1 rounded-2xl p-4 text-[0.82rem] leading-[1.45] motion-reduce:animate-none'

const timeBtn =
    'rounded-sm border border-border bg-white px-3 py-[0.45rem] text-[0.82rem] font-semibold text-copy tabular-nums transition-[border-color,color] duration-200 ease-[ease] hover:border-primary hover:text-primary'

export function SameSlot() {
    const [phase, setPhase] = useState<Phase>('idle')
    const [round, setRound] = useState(0)
    const [rebooked, setRebooked] = useState<string | null>(null)
    const timer = useRef<number | undefined>(undefined)

    useEffect(() => () => window.clearTimeout(timer.current), [])

    // Alternate who wins so the demo isn't always the same
    const winner = round % 2 === 1 ? 0 : 1

    const go = () => {
        window.clearTimeout(timer.current)
        setRound((r) => r + 1)
        setRebooked(null)
        setPhase('booking')
        timer.current = window.setTimeout(() => setPhase('done'), 1100)
    }

    return (
        <section
            id="same-slot"
            className={cn(sectionPad, 'border-y border-border bg-white')}
            aria-labelledby="same-slot-heading"
        >
            <div className="site-container">
                <div className="mx-auto max-w-176 text-center">
                    <Eyebrow className="justify-center text-primary-light">Fair booking</Eyebrow>
                    <SectionHeading id="same-slot-heading">
                        Two people. One slot. <Accent className="text-primary-light">One booking.</Accent>
                    </SectionHeading>
                    <Lede className="mx-auto">
                        Ever arrived to find someone else booked into your time? Watch what happens when two patients
                        grab the same appointment at the exact same moment.
                    </Lede>
                </div>

                <div className="mt-14 grid justify-items-center gap-8 min-[760px]:grid-cols-[1fr_auto_1fr] min-[760px]:items-center min-[760px]:gap-10">
                    {PATIENTS.map((p, i) => {
                        const won = phase === 'done' && i === winner
                        const lost = phase === 'done' && i !== winner
                        return (
                            <div
                                key={p.name}
                                className={cn(
                                    phone,
                                    // Keep the controls between the phones at every width
                                    i === 1
                                        ? 'order-3 min-[760px]:justify-self-start min-[760px]:rotate-3'
                                        : 'min-[760px]:justify-self-end min-[760px]:-rotate-3',
                                )}
                            >
                                <div className="relative flex min-h-97.5 flex-col gap-[0.8rem] overflow-hidden rounded-[28px] bg-background px-[0.9rem] pt-9 pb-4">
                                    <span
                                        className="absolute top-[0.6rem] left-1/2 h-4.5 w-18 -translate-x-1/2 rounded-full bg-ink-soft"
                                        aria-hidden="true"
                                    />
                                    <div className="flex items-center gap-[0.55rem] text-[0.8rem] font-semibold text-copy-light">
                                        <span className="grid size-[1.9rem] place-items-center rounded-full bg-primary text-[0.65rem] font-extrabold text-secondary">
                                            {p.initials}
                                        </span>
                                        {p.name}’s phone
                                    </div>

                                    <div className="grid gap-[0.15rem] rounded-2xl border border-border bg-white p-[0.9rem]">
                                        <span className="font-mono text-[0.6rem] tracking-[0.12em] text-copy-lighter uppercase">
                                            Metro Health Center
                                        </span>
                                        <strong className="text-[0.95rem] text-copy">Dr. Sarah Miller</strong>
                                        <span className="mt-[0.35rem] justify-self-start rounded-full bg-accent-bg px-[0.6rem] py-1 text-[0.8rem] font-bold text-primary tabular-nums">
                                            Tue 15 · 10:30
                                        </span>
                                    </div>

                                    <div className="flex flex-1 flex-col justify-end" aria-live="polite">
                                        {(phase === 'idle' || phase === 'booking') && (
                                            <span
                                                key={`btn-${round}`}
                                                className={cn(
                                                    'flex items-center justify-center rounded-full bg-primary p-[0.8rem] text-[0.9rem] font-bold text-white',
                                                    phase === 'booking' && 'animate-tap motion-reduce:animate-none',
                                                )}
                                            >
                                                {phase === 'booking' ? (
                                                    <>
                                                        <span
                                                            className="mr-[0.45rem] inline-block size-3.75 animate-spin rounded-full border-2 border-white/35 border-t-white [animation-duration:0.7s]"
                                                            aria-hidden="true"
                                                        />{' '}
                                                        Booking…
                                                    </>
                                                ) : (
                                                    'Book 10:30'
                                                )}
                                            </span>
                                        )}

                                        {(won || (lost && rebooked)) && (
                                            <div className={cn(result, 'bg-secondary text-secondary-content')}>
                                                <span
                                                    className="mb-1 grid size-8 place-items-center rounded-full bg-secondary-content text-secondary"
                                                    aria-hidden="true"
                                                >
                                                    <LuCheck size={18} strokeWidth={3} />
                                                </span>
                                                <strong className="text-[1.05rem]">You’re booked!</strong>
                                                <span>Dr. Miller · Tue {won ? '10:30' : rebooked}</span>
                                            </div>
                                        )}

                                        {lost && !rebooked && (
                                            <div className={cn(result, 'border border-border bg-white text-copy-light')}>
                                                <strong className="text-[1.05rem] text-primary">Just taken</strong>
                                                <span>Someone got 10:30 a moment before you. Next open times:</span>
                                                <div className="mt-2 flex flex-wrap gap-[0.4rem]">
                                                    {NEXT_TIMES.map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            className={timeBtn}
                                                            onClick={() => setRebooked(t)}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    <div className="flex flex-col items-center gap-[0.9rem] text-center">
                        <span className="font-serif text-[1.75rem] text-copy-lighter italic" aria-hidden="true">
                            vs.
                        </span>
                        <button
                            type="button"
                            className="btn btn-primary px-[1.6rem] py-[0.9rem] disabled:transform-none disabled:cursor-progress disabled:opacity-60"
                            onClick={go}
                            disabled={phase === 'booking'}
                        >
                            {phase === 'idle' ? (
                                'Both tap “Book”'
                            ) : (
                                <>
                                    <LuRotateCcw size={16} /> Try again
                                </>
                            )}
                        </button>
                        <span className="max-w-52 text-[0.82rem] text-copy-lighter">
                            {phase === 'done' && !rebooked
                                ? 'Tap a new time on the other phone.'
                                : 'Same doctor, same time, same instant.'}
                        </span>
                    </div>
                </div>

                <ul className="mx-auto mt-16 mb-0 grid max-w-240 list-none gap-6 p-0 min-[760px]:grid-cols-3 min-[760px]:gap-8">
                    {FACTS.map((f) => (
                        <li key={f.title} className="border-t-3 border-secondary pt-4">
                            <strong className="mb-[0.3rem] block text-[1.05rem] text-primary">{f.title}</strong>
                            <span className="text-[0.92rem] leading-[1.55] text-copy-light">{f.body}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default SameSlot

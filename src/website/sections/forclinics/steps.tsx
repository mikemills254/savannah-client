import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { LuCheck } from 'react-icons/lu'
import { cn } from '../../../lib/cn.ts'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { SectionHeading } from '../../components/section.tsx'
import { sectionPad } from '../../components/sectionStyles.ts'
import { avatar, avatarSm, pill, PILL_TONE } from './mockStyles.ts'

// --- Mock UI atoms ---

const mockLabel = 'mb-[0.35rem] block text-[0.75rem] font-semibold text-copy-light'

// Fake text input; `focus` gives it the focused ring
const mockField = (focus = false) =>
    cn(
        'mb-4 flex min-w-0 items-center gap-[0.15rem] rounded-sm border-[1.5px] bg-white px-[0.9rem] py-[0.7rem] text-[0.9rem] text-copy',
        focus ? 'border-primary shadow-[0_0_0_3px_var(--accent-bg)]' : 'border-border',
    )

const caret = 'h-[1.1em] w-[2px] bg-primary animate-caret motion-reduce:animate-none'

const mockBtn = 'inline-flex shrink-0 rounded-full bg-primary px-[1.1rem] py-[0.6rem] text-[0.85rem] font-semibold text-white'

const mockList = 'm-0 grid list-none gap-2 p-0'

const mockItem =
    'flex items-center gap-3 rounded-sm border border-border bg-white px-[0.85rem] py-[0.7rem] text-[0.86rem] text-copy'

const mockSub = 'block text-[0.75rem] text-copy-lighter'

// Flexible middle column that wraps long emails
const grow = 'min-w-0 flex-1 wrap-anywhere'

// --- Mock screens: illustrative, show what each setup step looks like ---

function SetupMock() {
    return (
        <>
            <span className={mockLabel}>Clinic name</span>
            <div className={mockField()}>St. Jude Health Center</div>
            <span className={mockLabel}>Time zone</span>
            <div className={mockField(true)}>
                Africa/Nairobi · GMT+3
                <span className={caret} />
            </div>
            <span className={mockBtn}>Save clinic</span>
        </>
    )
}

const INVITES = [
    { initials: 'AO', email: 'a.otieno@stjude.health', role: 'Doctor', state: 'ok' as const, label: 'Joined' },
    { initials: 'RP', email: 'r.patel@stjude.health', role: 'Doctor', state: 'wait' as const, label: 'Invited' },
    { initials: 'MK', email: 'm.kamau@stjude.health', role: 'Admin', state: 'ok' as const, label: 'Joined' },
]

function InviteMock() {
    return (
        <>
            <div className="flex items-start gap-[0.6rem]">
                <div className={cn(mockField(true), 'flex-1 wrap-anywhere')}>
                    new.doctor@stjude.health
                    <span className={caret} />
                </div>
                <span className={cn(mockBtn, 'mt-[0.15rem]')}>Invite</span>
            </div>
            <ul className={mockList}>
                {INVITES.map((m) => (
                    <li key={m.email} className={mockItem}>
                        <span className={cn(avatar, avatarSm)}>{m.initials}</span>
                        <div className={grow}>
                            {m.email}
                            <small className={mockSub}>{m.role}</small>
                        </div>
                        <span className={cn(pill, PILL_TONE[m.state])}>{m.label}</span>
                    </li>
                ))}
            </ul>
        </>
    )
}

const HOURS: { day: string; range: string | null }[] = [
    { day: 'Mon', range: '08:00 – 13:00' },
    { day: 'Tue', range: '08:00 – 13:00' },
    { day: 'Wed', range: null },
    { day: 'Thu', range: '13:00 – 18:00' },
    { day: 'Fri', range: '08:00 – 16:00' },
    { day: 'Sat', range: null },
]

// On/off switch with a white knob
const toggle =
    'relative h-5 w-[2.2rem] rounded-full after:absolute after:top-[3px] after:size-[calc(1.25rem-6px)] after:rounded-full after:bg-white after:shadow-sm'

const hoursRange = 'rounded-sm border border-border px-[0.7rem] py-[0.45rem] font-mono text-[0.8rem] font-medium'

function HoursMock() {
    return (
        <>
            <div className={cn(mockItem, 'mb-4')}>
                <span className={cn(avatar, avatarSm)}>AO</span>
                <div className={grow}>
                    Dr. Otieno
                    <small className={mockSub}>Weekly hours · St. Jude</small>
                </div>
            </div>
            <div className="grid gap-2">
                {HOURS.map((h) => (
                    <div
                        key={h.day}
                        className="grid grid-cols-[2.5rem_2.4rem_1fr] items-center gap-3 text-[0.85rem] font-semibold text-copy"
                    >
                        <span>{h.day}</span>
                        <span
                            className={cn(toggle, h.range ? 'bg-secondary-dark after:right-[3px]' : 'bg-border after:left-[3px]')}
                        />
                        <span
                            className={cn(
                                hoursRange,
                                h.range ? 'bg-white' : 'border-dashed bg-transparent text-copy-lighter',
                            )}
                        >
                            {h.range ?? 'Not working'}
                        </span>
                    </div>
                ))}
            </div>
        </>
    )
}

const BOOKINGS = [
    { time: '08:30', who: 'Jane D.', doctor: 'Dr. Otieno', state: 'ok' as const, label: 'Booked' },
    { time: '09:00', who: 'Peter W.', doctor: 'Dr. Otieno', state: 'off' as const, label: 'Cancelled' },
    { time: '09:00', who: 'Open slot', doctor: 'Released', state: 'wait' as const, label: 'Bookable' },
    { time: '10:30', who: 'Amina K.', doctor: 'Dr. Patel', state: 'ok' as const, label: 'Booked' },
]

function BookingsMock() {
    return (
        <ul className={mockList}>
            {BOOKINGS.map((b, i) => (
                <li key={i} className={mockItem}>
                    <span className="font-mono text-[0.82rem] font-bold text-primary">{b.time}</span>
                    <div className={grow}>
                        {b.who}
                        <small className={mockSub}>{b.doctor}</small>
                    </div>
                    <span className={cn(pill, PILL_TONE[b.state])}>{b.label}</span>
                </li>
            ))}
        </ul>
    )
}

interface Step {
    title: string
    desc: string
    path: string
    screen: ReactNode
}

const STEPS: Step[] = [
    {
        title: 'Set up your clinic',
        desc: 'Your practice gets its own space with your clinic name and local time zone.',
        path: 'clinic/settings',
        screen: <SetupMock />,
    },
    {
        title: 'Invite your doctors',
        desc: 'Add doctors and admins by email. They set a private password and they’re in.',
        path: 'clinic/team',
        screen: <InviteMock />,
    },
    {
        title: 'Set working hours',
        desc: 'Define each doctor’s weekly schedule. Patients only see real in-clinic hours.',
        path: 'clinic/team/otieno/hours',
        screen: <HoursMock />,
    },
    {
        title: 'Patients start booking',
        desc: 'Patients pick your clinic, a doctor and an open slot. Cancellations free it again.',
        path: 'clinic/appointments',
        screen: <BookingsMock />,
    },
]

// Step tab; the selected one turns purple
const tabBtn =
    'group grid grid-cols-[2.75rem_1fr] items-start gap-[0.9rem] rounded-md border border-border bg-white px-[1.1rem] py-4 text-left text-copy transition-[background,border-color,box-shadow,color] duration-250 ease-[ease] hover:border-accent-border aria-selected:border-primary aria-selected:bg-primary aria-selected:text-white aria-selected:shadow-md motion-reduce:transition-none'

const tabNum =
    'grid size-11 place-items-center rounded-full bg-accent-bg font-mono text-[0.72rem] font-bold text-primary transition-[background,color] duration-250 ease-[ease] group-aria-selected:bg-secondary group-aria-selected:text-secondary-content'

export function ClinicSteps() {
    const [active, setActive] = useState(0)
    const tabs = useRef<(HTMLButtonElement | null)[]>([])

    // Roving focus per the WAI-ARIA tabs pattern
    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
        if (!delta) return
        e.preventDefault()
        const next = (active + delta + STEPS.length) % STEPS.length
        setActive(next)
        tabs.current[next]?.focus()
    }

    const step = STEPS[active]

    return (
        <section id="clinic-steps" className={cn(sectionPad, 'border-y border-border bg-white')} aria-labelledby="fc-steps-heading">
            <div className="site-container">
                <Eyebrow className="text-primary-light">Getting started</Eyebrow>
                <SectionHeading id="fc-steps-heading" className="max-w-[20ch]">
                    From phone lines to open diaries in <Accent>four steps.</Accent>
                </SectionHeading>

                <div className="mt-12 grid gap-8 min-[960px]:grid-cols-[0.9fr_1.1fr] min-[960px]:items-start min-[960px]:gap-14">
                    <div className="grid gap-[0.6rem]" role="tablist" aria-orientation="vertical" aria-label="Setup steps">
                        {STEPS.map((s, i) => (
                            <button
                                key={s.title}
                                ref={(el) => {
                                    tabs.current[i] = el
                                }}
                                type="button"
                                role="tab"
                                id={`fc-tab-${i}`}
                                aria-selected={active === i}
                                aria-controls="fc-tabpanel"
                                tabIndex={active === i ? 0 : -1}
                                className={tabBtn}
                                onClick={() => setActive(i)}
                                onKeyDown={onKeyDown}
                            >
                                <span className={tabNum}>
                                    {i < active ? <LuCheck size={16} strokeWidth={3} /> : String(i + 1).padStart(2, '0')}
                                </span>
                                <span>
                                    <strong className="mt-[0.15rem] block text-[1.02rem]">{s.title}</strong>
                                    <span className="mt-[0.2rem] block text-[0.86rem] leading-normal text-copy-light group-aria-selected:text-white/72">
                                        {s.desc}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>

                    <div
                        className="overflow-hidden rounded-lg border border-border bg-background shadow-lg min-[960px]:sticky min-[960px]:top-24"
                        role="tabpanel"
                        id="fc-tabpanel"
                        aria-labelledby={`fc-tab-${active}`}
                    >
                        <div
                            className="flex items-center gap-[0.4rem] border-b border-border bg-white px-4 py-[0.7rem] font-mono text-[0.7rem] text-copy-lighter"
                            aria-hidden="true"
                        >
                            <i className="size-[9px] rounded-full bg-border" />
                            <i className="size-[9px] rounded-full bg-border" />
                            <i className="size-[9px] rounded-full bg-border" />
                            <span className="ml-2 truncate">docconnect / {step.path}</span>
                        </div>
                        <div
                            className="min-h-[330px] animate-[print_0.35s_cubic-bezier(0.16,1,0.3,1)_both] p-6 motion-reduce:animate-none"
                            key={active}
                        >
                            {step.screen}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ClinicSteps

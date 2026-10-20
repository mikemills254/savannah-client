import { LuHospital, LuStethoscope, LuCalendarCheck, LuShieldCheck, LuCalendarDays } from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { Lede, SectionHeading } from '../components/section.tsx'
import { sectionPad } from '../components/sectionStyles.ts'

interface StepItem {
    title: string
    description: string
    icon: IconType
}

const STEPS: StepItem[] = [
    {
        title: 'Find a clinic',
        description: 'Browse the clinics and hospitals on the platform and choose where you want to be seen.',
        icon: LuHospital,
    },
    {
        title: 'Pick a doctor',
        description: 'See who works there and choose the right specialist for your visit.',
        icon: LuStethoscope,
    },
    {
        title: 'Book an open slot',
        description: "Times come from the doctor's real weekly hours, shown in the clinic's local time.",
        icon: LuCalendarCheck,
    },
    {
        title: 'It’s yours',
        description: "Once a slot is taken it's gone. Nobody else can book it.",
        icon: LuShieldCheck,
    },
    {
        title: 'Manage your visits',
        description: 'See what’s coming up and cancel if plans change, freeing the slot for someone else.',
        icon: LuCalendarDays,
    },
]

// The floor line: vertical on mobile, horizontal across the stops from 960px
const route =
    'relative m-0 grid list-none gap-9 p-0 min-[960px]:grid-cols-5 min-[960px]:gap-7 ' +
    'before:absolute before:top-2 before:bottom-2 before:left-[1.375rem] before:-ml-[3px] before:w-[6px] before:rounded-full ' +
    'before:[background:repeating-linear-gradient(180deg,transparent_0_18px,rgba(28,36,6,0.18)_18px_22px),var(--secondary)] ' +
    'min-[960px]:before:top-[1.375rem] min-[960px]:before:right-0 min-[960px]:before:bottom-auto min-[960px]:before:left-0 ' +
    'min-[960px]:before:-mt-[3px] min-[960px]:before:ml-0 min-[960px]:before:h-[6px] min-[960px]:before:w-auto ' +
    'min-[960px]:before:[background:repeating-linear-gradient(90deg,transparent_0_18px,rgba(28,36,6,0.18)_18px_22px),var(--secondary)]'

const marker =
    'absolute top-0 left-0 grid size-11 place-items-center rounded-full border-3 [transition:scale_0.25s_cubic-bezier(0.34,1.56,0.64,1),background_0.2s_ease] group-hover:scale-112 motion-reduce:transition-none'

export function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className={cn(sectionPad, 'border-b border-border bg-white')}
            aria-labelledby="how-it-works-heading"
        >
            <div className="site-container">
                <div className="mb-14 grid items-end gap-4 min-[960px]:mb-18 min-[960px]:grid-cols-2 min-[960px]:gap-16">
                    <div>
                        <Eyebrow className="text-primary-light">How it works</Eyebrow>
                        <SectionHeading id="how-it-works-heading">
                            Follow the <Accent className="text-secondary-dark">green line.</Accent>
                        </SectionHeading>
                    </div>
                    <Lede className="min-[960px]:justify-self-end">
                        Like the coloured lines on a hospital floor, there’s one route from “I need a doctor” to a
                        confirmed visit. Five stops, no detours.
                    </Lede>
                </div>

                <ol className={route}>
                    {STEPS.map((step, i) => {
                        const Icon = step.icon
                        // The final stop's marker is filled in (it wins over the hover tint)
                        const isLast = i === STEPS.length - 1
                        return (
                            <li key={step.title} className="group relative pl-17 min-[960px]:pt-18 min-[960px]:pl-0">
                                <span
                                    className={cn(
                                        marker,
                                        isLast
                                            ? 'border-primary bg-primary text-secondary'
                                            : 'border-secondary-dark bg-white text-primary group-hover:bg-secondary-light',
                                    )}
                                    aria-hidden="true"
                                >
                                    <Icon size={18} />
                                </span>
                                <span className="mb-[0.35rem] block font-mono text-[0.66rem] tracking-[0.14em] text-copy-lighter uppercase">
                                    {i === STEPS.length - 1 ? 'Arrived' : `Stop ${String(i + 1).padStart(2, '0')}`}
                                </span>
                                <h3 className="m-0 mb-[0.4rem] text-[1.15rem] text-copy">{step.title}</h3>
                                <p className="m-0 max-w-[40ch] text-[0.92rem] leading-[1.55] text-copy-light">
                                    {step.description}
                                </p>
                            </li>
                        )
                    })}
                </ol>
            </div>
        </section>
    )
}

import { useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { cn } from '../../../lib/cn.ts'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { Lede, SectionHeading } from '../../components/section.tsx'
import { sectionPad } from '../../components/sectionStyles.ts'

const FAQS = [
    {
        q: 'Can a doctor work at more than one clinic?',
        a: 'Yes. A doctor who practises at several locations keeps separate working hours at each clinic on the platform.',
    },
    {
        q: 'What happens when a patient cancels?',
        a: 'The slot is released straight back to your schedule so another patient can book it, with no manual rescheduling.',
    },
    {
        q: 'What time zone are bookings shown in?',
        a: "Every booking and doctor schedule runs in your clinic's local time zone, for your team and your patients.",
    },
    {
        q: 'Can I remove a doctor from my clinic?',
        a: 'Yes, at any time. Their past appointment records are kept, and adding them back restores their history.',
    },
    {
        q: 'How do my doctors get access?',
        a: 'You add them by email from your clinic space. They accept the invite, set a private password and can see their schedule straight away.',
    },
    {
        q: 'Why is my clinic reviewed before going live?',
        a: 'Patients trust that every clinic on DocConnect is real. We check each application before it can take bookings.',
    },
]

// Number · question · plus-icon row
const questionBtn =
    'grid w-full grid-cols-[2.25rem_1fr_1.6rem] items-center gap-3 border-0 bg-transparent px-0 py-5 text-left text-[1.02rem] font-semibold text-copy hover:text-primary'

// Plus icon that turns into a lime × when open
const questionIcon =
    'grid size-[1.6rem] place-items-center rounded-full [transition:rotate_0.3s_ease,background_0.2s_ease] motion-reduce:transition-none'

export function ClinicFaq() {
    const [open, setOpen] = useState<number | null>(0)

    return (
        <section className={sectionPad} aria-labelledby="fc-faq-heading">
            <div className="site-container grid gap-10 min-[960px]:grid-cols-[0.8fr_1.2fr] min-[960px]:items-start min-[960px]:gap-16">
                <div>
                    <Eyebrow className="text-primary-light">Questions</Eyebrow>
                    <SectionHeading id="fc-faq-heading">
                        Asked at the <Accent>front desk.</Accent>
                    </SectionHeading>
                    <Lede>Straight answers for clinic owners and practice managers.</Lede>
                </div>

                <div className="border-t border-border">
                    {FAQS.map((f, i) => {
                        const isOpen = open === i
                        return (
                            <div key={f.q} className="border-b border-border">
                                <h3 className="m-0">
                                    <button
                                        type="button"
                                        className={questionBtn}
                                        aria-expanded={isOpen}
                                        aria-controls={`fc-answer-${i}`}
                                        onClick={() => setOpen(isOpen ? null : i)}
                                    >
                                        <span className="font-mono text-[0.72rem] text-copy-lighter">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span>{f.q}</span>
                                        <span
                                            className={cn(
                                                questionIcon,
                                                isOpen
                                                    ? 'rotate-45 bg-secondary text-secondary-content'
                                                    : 'bg-accent-bg text-primary',
                                            )}
                                            aria-hidden="true"
                                        >
                                            <LuPlus size={14} strokeWidth={3} />
                                        </span>
                                    </button>
                                </h3>
                                {/* Accordion: animating grid rows 0fr → 1fr reveals the answer at its natural height */}
                                <div
                                    className={cn(
                                        'grid transition-[grid-template-rows] duration-350 ease-out-expo motion-reduce:transition-none',
                                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                    )}
                                    id={`fc-answer-${i}`}
                                    inert={!isOpen}
                                >
                                    <div className="overflow-hidden">
                                        <p className="m-0 pt-0 pr-9 pb-[1.35rem] pl-12 text-[0.95rem] leading-[1.6] text-copy-light">
                                            {f.a}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default ClinicFaq

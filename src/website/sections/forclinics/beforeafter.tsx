import { LuCheck } from 'react-icons/lu'
import { cn } from '../../../lib/cn.ts'
import { Accent, Eyebrow, LiveBadge } from '../../../components/ui.tsx'
import { SectionHeading } from '../../components/section.tsx'
import { sectionPad } from '../../components/sectionStyles.ts'

const AFTER = [
    'Patients book themselves, any time of day',
    "Times come straight from each doctor's real hours",
    'A slot can only ever be booked once',
    'Cancelled slots go straight back on the schedule',
]

// Ruled paper diary, tilted, with a red margin rule (before) and a coffee ring (after)
const diary =
    'relative m-0 -rotate-2 rounded-[4px] bg-diary pt-6 pr-6 pb-5 pl-12 font-hand text-[#2a3a5c] shadow-[0_18px_30px_rgba(35,18,64,0.12)] ' +
    'before:absolute before:inset-y-0 before:left-[2.1rem] before:w-[2px] before:bg-[rgba(237,58,58,0.35)] ' +
    'after:absolute after:right-5 after:bottom-3 after:size-[86px] after:rounded-full after:border-6 after:border-[rgba(139,90,43,0.13)]'

// One handwritten line, sitting on the paper's 34px rules
const diaryLine = 'text-[0.92rem] leading-[34px]'

export function BeforeAfter() {
    return (
        <section className={cn(sectionPad, 'border-y border-border bg-white')} aria-labelledby="fc-ba-heading">
            <div className="site-container">
                <Eyebrow className="text-primary-light">Before &amp; after</Eyebrow>
                <SectionHeading id="fc-ba-heading">
                    Retire the <Accent>paper diary.</Accent>
                </SectionHeading>

                <div className="mt-12 grid items-center gap-10 min-[860px]:grid-cols-[1fr_auto_1fr] min-[860px]:gap-8">
                    <figure className={diary}>
                        <figcaption className="mb-1 text-[1.05rem] underline">Tuesday — Dr. O</figcaption>
                        <ul className="m-0 list-none p-0">
                            <li className={diaryLine}>9:00 Mrs. Wanjiru (called ×3, on hold)</li>
                            <li className={diaryLine}>
                                <s className="decoration-[#c0392b] decoration-2">9:30 Mr. Kariuki</s> → moved to Thu??
                            </li>
                            <li className={diaryLine}>10:30 Ken M.</li>
                            <li className={diaryLine}>10:30 Amina K.</li>
                            <li className={diaryLine}>11:00 — no-show, slot wasted</li>
                            <li className={diaryLine}>ring back re: Friday</li>
                        </ul>
                        <span
                            className="absolute top-[7.6rem] right-4 rotate-8 rounded-full border-[2.5px] border-[#c0392b] px-[0.6rem] py-[0.1rem] font-bold text-[#c0392b]"
                            aria-label="Double-booked"
                        >
                            clash!
                        </span>
                    </figure>

                    <span className="justify-self-center font-serif text-[1.75rem] text-copy-lighter italic" aria-hidden="true">
                        vs.
                    </span>

                    <div className="rounded-lg border-2 border-primary bg-white p-6 shadow-lg">
                        <div className="mb-[1.1rem] flex items-center justify-between gap-4 border-b border-border pb-4 text-primary">
                            <strong>With DocConnect</strong>
                            <LiveBadge>Live</LiveBadge>
                        </div>
                        <ul className="m-0 grid list-none gap-[0.85rem] p-0">
                            {AFTER.map((t) => (
                                <li key={t} className="flex items-start gap-[0.65rem] text-[0.95rem] font-medium text-copy">
                                    <LuCheck size={18} className="mt-0.5 shrink-0 text-secondary-dark" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default BeforeAfter

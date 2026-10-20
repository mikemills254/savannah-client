import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { Lede, SectionHeading } from '../components/section.tsx'
import { sectionPad } from '../components/sectionStyles.ts'

interface LabResult {
    test: string
    finding: string
    result: string
    reference?: string
}

const RESULTS: LabResult[] = [
    {
        test: 'Slot source',
        finding: "Times come straight from each doctor's actual weekly working hours, so you only see them when they're in.",
        result: 'Real rota',
    },
    {
        test: 'Time zone',
        finding: "Every appointment is shown in the clinic's local time, whether you're down the road or travelling.",
        result: 'Clinic local',
    },
    {
        test: 'Double-bookings',
        finding: 'The moment you reserve a slot it leaves availability. Nobody else can claim it.',
        result: '0',
        reference: 'Ref: 0',
    },
    {
        test: 'Cancellation',
        finding: 'Plans change. Cancel any upcoming visit and the slot is freed for the next patient.',
        result: '1 click',
    },
]

// Small mono caption used for labels on the report
const caption = 'font-mono text-[0.62rem] text-copy-lighter uppercase'

// Shared column layout of the header row and result rows (display is set per element)
const columns = 'grid-cols-[1fr_auto] gap-x-4 gap-y-[0.35rem] sm:grid-cols-[1fr_8.5rem_4.5rem]'

// Clipboard with its clip on top; straightens on hover
const report =
    'relative rotate-[0.75deg] rounded-md border border-border bg-white px-5 pt-8 pb-5 shadow-lg transition-[rotate] duration-500 ease-out-expo hover:rotate-0 motion-reduce:transition-none sm:px-8 sm:pt-9 sm:pb-6 ' +
    'before:absolute before:-top-[14px] before:left-1/2 before:h-7 before:w-[120px] before:-translate-x-1/2 before:rounded-[8px_8px_4px_4px] before:bg-[linear-gradient(var(--primary-light),var(--primary))] before:shadow-sm'

function HeadField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span className={cn(caption, 'block tracking-[0.14em]')}>{label}</span>
            <strong className="text-[0.875rem] text-copy">{value}</strong>
        </div>
    )
}

export function Reliability() {
    return (
        <section id="why-reliable" className={sectionPad} aria-labelledby="reliability-heading">
            <div className="site-container grid items-center gap-14 min-[960px]:grid-cols-[0.8fr_1.2fr] min-[960px]:gap-18">
                <div>
                    <Eyebrow className="text-primary-light">Why it’s reliable</Eyebrow>
                    <SectionHeading id="reliability-heading">
                        We ran the <Accent>tests.</Accent>
                    </SectionHeading>
                    <Lede>A booking system is only as good as its availability. Here’s how ours checks out.</Lede>
                </div>

                <article className={report} aria-label="Reliability report">
                    <div className="mb-1 grid grid-cols-2 gap-x-6 gap-y-3 border-b-2 border-primary pb-4 sm:grid-cols-3">
                        <HeadField label="Patient" value="Your schedule" />
                        <HeadField label="Ordered by" value="You" />
                        <HeadField label="Status" value="All clear" />
                    </div>

                    <div
                        className={cn(columns, caption, 'hidden pt-[0.85rem] pb-[0.4rem] tracking-[0.14em] sm:grid')}
                        aria-hidden="true"
                    >
                        <span>Test</span>
                        <span>Result</span>
                        <span className="text-right">Flag</span>
                    </div>

                    {RESULTS.map((r) => (
                        <div
                            key={r.test}
                            className={cn(
                                columns,
                                "grid border-0 border-t border-dotted border-border py-4 [grid-template-areas:'test_test'_'result_flag'] sm:items-start sm:[grid-template-areas:'test_result_flag']",
                            )}
                        >
                            <div className="[grid-area:test]">
                                <strong className="block text-[0.95rem] text-copy">{r.test}</strong>
                                <p className="mt-[0.2rem] mb-0 text-[0.82rem] leading-normal text-copy-light">
                                    {r.finding}
                                </p>
                            </div>
                            <div className="font-mono text-[0.85rem] font-bold text-primary [grid-area:result]">
                                {r.result}
                                {r.reference && (
                                    <span className={cn(caption, 'mt-[0.15rem] block font-normal tracking-[0.08em]')}>
                                        {r.reference}
                                    </span>
                                )}
                            </div>
                            <span className="self-start justify-self-end rounded-full bg-[rgba(186,218,85,0.4)] px-[0.55rem] py-[0.18rem] font-mono text-[0.62rem] font-bold tracking-[0.12em] text-[#3f520c] uppercase [grid-area:flag]">
                                Normal
                            </span>
                        </div>
                    ))}

                    <div className="mt-2 flex items-end justify-between gap-4 border-t border-border pt-4 text-[0.75rem] text-copy-lighter">
                        <span>Reviewed &amp; signed</span>
                        <em className="font-script text-[1.4rem] text-primary-light">DocConnect</em>
                    </div>
                </article>
            </div>
        </section>
    )
}

export default Reliability

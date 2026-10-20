import { Link } from 'react-router-dom'
import { type Facility } from '../../api/client.ts'
import { useClock } from '../../hooks/useClock.ts'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { Lede, SectionHeading } from '../components/section.tsx'
import { sectionPad } from '../components/sectionStyles.ts'

interface ClinicsSectionProps {
    clinics: Facility[]
}

// Current wall-clock time at the clinic; falls back gracefully on a bad timezone id
function localTime(now: Date, timeZone: string) {
    try {
        return new Intl.DateTimeFormat([], { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
    } catch {
        return '--:--'
    }
}

// Shared column layout of the board header and rows
const boardCols = 'grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto]'

export function Clinics({ clinics }: ClinicsSectionProps) {
    const now = useClock()

    // CRITICAL REQUIREMENT:
    // If the list is empty or request fails, hide the section entirely.
    // Never show an error or an empty state on the landing page.
    if (!clinics || clinics.length === 0) {
        return null
    }

    return (
        <section
            id="clinics"
            className={cn(sectionPad, 'relative overflow-hidden bg-night-glow text-white')}
            aria-labelledby="clinics-heading"
        >
            <div className="site-container">
                <Eyebrow className="text-secondary">Clinics on the platform</Eyebrow>
                <SectionHeading id="clinics-heading" tone="dark">
                    Who’s <Accent className="text-secondary">in the building.</Accent>
                </SectionHeading>
                <Lede tone="dark">
                    Every clinic and hospital you can book with, and what time it is there right now.
                </Lede>

                <div
                    className="mt-12 rounded-md border border-white/8 bg-ink px-4 py-1 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.02),0_30px_60px_rgba(0,0,0,0.3)] sm:px-6"
                    role="table"
                    aria-label="Clinic directory"
                >
                    <div
                        className={cn(
                            boardCols,
                            'border-b border-white/12 py-[0.9rem] font-mono text-[0.62rem] tracking-[0.16em] text-white/40 uppercase',
                        )}
                        role="row"
                    >
                        <span role="columnheader">No.</span>
                        <span role="columnheader">Clinic</span>
                        <span role="columnheader" className="text-right">
                            Local time
                        </span>
                    </div>

                    {clinics.map((clinic, i) => (
                        <div
                            key={clinic.id}
                            className={cn(
                                boardCols,
                                'border-0 border-b border-dashed border-white/10 py-[1.1rem] transition-colors duration-200 ease-[ease] last:border-b-0 hover:bg-white/2.5',
                            )}
                            role="row"
                        >
                            <span className="font-mono text-[0.8rem] text-white/35" role="cell">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <div role="cell">
                                <div className="text-[1.05rem] font-bold wrap-anywhere text-white">{clinic.name}</div>
                                <div className="mt-[0.2rem] flex flex-wrap items-center gap-x-[0.9rem] gap-y-[0.35rem] font-mono text-[0.7rem] tracking-[0.04em] text-white/50">
                                    {clinic.timezone && <span>{clinic.timezone}</span>}
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-[0.35rem] before:size-1.5 before:rounded-full',
                                            clinic.is_active
                                                ? 'text-secondary before:animate-breathe before:bg-secondary motion-reduce:before:animate-none'
                                                : 'before:bg-white/30',
                                        )}
                                    >
                                        {clinic.is_active ? 'Taking bookings' : 'Paused'}
                                    </span>
                                    {clinic.is_active && (
                                        <Link
                                            to={`/book?facility=${clinic.id}`}
                                            className="font-sans text-[0.75rem] font-semibold tracking-normal text-white underline decoration-secondary underline-offset-[3px] hover:text-secondary"
                                        >
                                            Book →
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <span
                                className="text-right font-mono text-[1.15rem] text-secondary tabular-nums [text-shadow:0_0_12px_rgba(186,218,85,0.45)]"
                                role="cell"
                            >
                                {clinic.timezone ? localTime(now, clinic.timezone) : '--:--'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Clinics

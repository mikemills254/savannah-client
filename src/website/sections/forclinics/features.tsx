import type { ReactNode } from 'react'
import { LuArrowRight, LuHospital } from 'react-icons/lu'
import { useClock } from '../../../hooks/useClock.ts'
import { cn } from '../../../lib/cn.ts'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { SectionHeading } from '../../components/section.tsx'
import { rotaCell, rotaCellBooked, rotaCellOpen, rotaShift, sectionPad } from '../../components/sectionStyles.ts'
import { avatar, avatarGone, avatarLg, avatarSm, pill, PILL_TONE } from './mockStyles.ts'

const CLINIC_TZ = 'Africa/Nairobi'

function clinicTime(now: Date) {
    return new Intl.DateTimeFormat([], { timeZone: CLINIC_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
}

// --- Bento tile ---

type TileTone = 'light' | 'dark' | 'lime'

const TILE_TONE: Record<TileTone, { tile: string; title: string; text: string }> = {
    light: { tile: 'border-border bg-white', title: 'text-primary', text: 'text-copy-light' },
    dark: { tile: 'border-primary bg-primary', title: 'text-white', text: 'text-white/72' },
    lime: { tile: 'border-secondary-dark bg-secondary', title: 'text-secondary-content', text: 'text-[rgba(28,36,6,0.75)]' },
}

interface TileProps {
    // Illustration above the copy
    viz: ReactNode
    title: string
    children: ReactNode
    tone?: TileTone
    // Spans two columns on the three-column layout
    wide?: boolean
}

function Tile({ viz, title, children, tone = 'light', wide = false }: TileProps) {
    const t = TILE_TONE[tone]
    return (
        <article
            className={cn(
                'relative flex min-h-[230px] flex-col justify-between gap-7 overflow-hidden rounded-lg border p-6 transition-[translate,box-shadow] duration-250 ease-[ease] hover:-translate-y-[3px] hover:shadow-md motion-reduce:transition-none',
                t.tile,
                wide && 'min-[1024px]:col-span-2',
            )}
        >
            {viz}
            <div>
                <h3 className={cn('mb-[0.35rem] text-[1.15rem]', t.title)}>{title}</h3>
                <p className={cn('m-0 max-w-[44ch] text-[0.9rem] leading-[1.55]', t.text)}>{children}</p>
            </div>
        </article>
    )
}

// Row of chips / avatars inside a tile
const vizRow = 'flex flex-wrap items-center gap-2'

// Time chip; pair with one CHIP_TONE
const chip = 'rounded-sm border px-[0.9rem] py-2 text-[0.9rem] font-semibold tabular-nums'

const CHIP_TONE = {
    open: 'border-border bg-white text-copy',
    taken: 'border-secondary-dark bg-secondary text-secondary-content',
    // Rejected second booking, with a red "rejected" tag on the corner
    rejected:
        "relative border-error bg-white text-error line-through after:absolute after:-top-[0.6rem] after:-right-[0.6rem] after:rounded-full after:bg-error after:px-[0.4rem] after:py-[0.05rem] after:font-mono after:text-[0.55rem] after:tracking-[0.08em] after:text-white after:no-underline after:uppercase after:content-['rejected']",
    off: 'border-[rgba(28,36,6,0.2)] bg-transparent text-[rgba(28,36,6,0.55)] line-through',
}

const badge =
    'inline-flex items-center gap-[0.3rem] rounded-full border border-accent-border bg-accent-bg px-[0.65rem] py-[0.3rem] text-[0.78rem] font-semibold text-primary'

export function ClinicFeatures() {
    const now = useClock()

    return (
        <section className={sectionPad} aria-labelledby="fc-features-heading">
            <div className="site-container">
                <Eyebrow className="text-primary-light">What your clinic gets</Eyebrow>
                <SectionHeading id="fc-features-heading">
                    Built around how clinics <Accent>actually run.</Accent>
                </SectionHeading>

                <div className="mt-12 grid gap-4 min-[720px]:grid-cols-2 min-[1024px]:grid-cols-3">
                    <Tile
                        wide
                        title="Real working hours"
                        viz={
                            <div className="relative h-9 rounded-[6px] bg-rota-grid" aria-hidden="true">
                                <div className={rotaShift} style={{ left: '0%', width: '50%' }}>
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <span key={i} className={cn(rotaCell, i % 3 === 1 ? rotaCellBooked : rotaCellOpen)} />
                                    ))}
                                </div>
                                <div className={rotaShift} style={{ left: '60%', width: '40%' }}>
                                    {Array.from({ length: 8 }, (_, i) => (
                                        <span key={i} className={cn(rotaCell, i % 4 === 0 ? rotaCellBooked : rotaCellOpen)} />
                                    ))}
                                </div>
                            </div>
                        }
                    >
                        Set each doctor’s weekly shifts once. Patients only ever see times when the doctor is
                        actually in.
                    </Tile>

                    <Tile
                        tone="dark"
                        title="Clinic local time"
                        viz={
                            <div aria-hidden="true">
                                <div className="font-mono text-[2.75rem] leading-none font-bold text-secondary tabular-nums text-shadow-[0_0_18px_rgba(186,218,85,0.4)]">
                                    {clinicTime(now)}
                                </div>
                                <span className="mt-[0.4rem] block font-mono text-[0.68rem] tracking-widest text-white/50 uppercase">
                                    {CLINIC_TZ}
                                </span>
                            </div>
                        }
                    >
                        Every slot and appointment runs in your clinic’s time zone. No conversion confusion.
                    </Tile>

                    <Tile
                        title="Zero double-booking"
                        viz={
                            <div className={vizRow} aria-hidden="true">
                                <span className={cn(chip, CHIP_TONE.taken)}>10:30</span>
                                <span className={cn(chip, CHIP_TONE.rejected)}>10:30</span>
                            </div>
                        }
                    >
                        Once a patient takes a slot it’s reserved. The database won’t accept a second booking.
                    </Tile>

                    <Tile
                        tone="lime"
                        title="Automatic slot release"
                        viz={
                            <div className={vizRow} aria-hidden="true">
                                <span className={cn(chip, CHIP_TONE.off)}>10:30</span>
                                <LuArrowRight size={16} className="text-secondary-content" />
                                <span className={cn(chip, CHIP_TONE.open)}>10:30</span>
                            </div>
                        }
                    >
                        When a patient cancels, the slot re-opens straight away for the next person.
                    </Tile>

                    <Tile
                        title="Multi-clinic doctors"
                        viz={
                            <div className={vizRow} aria-hidden="true">
                                <span className={cn(avatar, avatarLg)}>AO</span>
                                <span className={badge}>
                                    <LuHospital size={13} /> St. Jude
                                </span>
                                <span className={badge}>
                                    <LuHospital size={13} /> Metro Health
                                </span>
                            </div>
                        }
                    >
                        Doctors at several clinics keep separate hours at each one.
                    </Tile>

                    <Tile
                        title="Easy team management"
                        viz={
                            <div className={vizRow} aria-hidden="true">
                                <span className={cn(avatar, avatarSm)}>MK</span>
                                <span className={cn(avatar, avatarSm)}>RP</span>
                                <span className={cn(avatar, avatarSm, avatarGone)}>JS</span>
                                <span className={cn(pill, PILL_TONE.wait)}>History kept</span>
                            </div>
                        }
                    >
                        Remove a doctor at any time without losing their past appointments.
                    </Tile>
                </div>
            </div>
        </section>
    )
}

export default ClinicFeatures

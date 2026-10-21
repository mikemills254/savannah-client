import { Link } from 'react-router-dom'
import { LuArrowRight } from 'react-icons/lu'
import { cn } from '../../../lib/cn.ts'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { Lede, SectionHeading } from '../../components/section.tsx'
import { ctaBand, ctaBtn, ctaSection } from '../../components/sectionStyles.ts'

// One "label … value" row on the application card
const licenceLine =
    'flex items-baseline justify-between gap-4 border-0 border-b border-dotted border-border py-2 text-[0.82rem]'

const licenceLabel = 'font-mono text-[0.6rem] tracking-[0.12em] text-copy-lighter uppercase'

export function ClinicCta() {
    return (
        <section className={ctaSection} aria-labelledby="fc-cta-heading">
            <div className="site-container">
                <div className={cn('group', ctaBand)}>
                    <div>
                        <Eyebrow className="text-secondary">Bring your clinic on board</Eyebrow>
                        <SectionHeading id="fc-cta-heading" tone="dark" size="lg">
                            Put your clinic <Accent className="text-secondary">on the map.</Accent>
                        </SectionHeading>
                        <Lede tone="band">
                            Create your admin account and tell us about your clinic. We review every application, then
                            your team can start taking bookings.
                        </Lede>
                        <Link to="/auth/register?as=clinic" className={cn('btn btn-accent', ctaBtn)}>
                            Apply for a clinic space
                            <LuArrowRight size={18} />
                        </Link>
                    </div>

                    <div
                        className="relative w-full max-w-[290px] justify-self-center rounded-[12px] bg-white px-5 pt-5 pb-[1.6rem] text-copy shadow-[0_20px_40px_rgba(0,0,0,0.3)] rotate-3 transition-[rotate] duration-400 ease-spring group-hover:-rotate-1 motion-reduce:transition-none"
                        aria-hidden="true"
                    >
                        <div className="mb-2 border-b-2 border-primary pb-[0.6rem] font-mono text-[0.66rem] font-bold tracking-[0.16em] text-primary uppercase">
                            Clinic application
                        </div>
                        <div className={licenceLine}>
                            <span className={licenceLabel}>Clinic</span>
                            <strong>Your clinic</strong>
                        </div>
                        <div className={licenceLine}>
                            <span className={licenceLabel}>Time zone</span>
                            <strong>Local</strong>
                        </div>
                        <div className={licenceLine}>
                            <span className={licenceLabel}>Doctors</span>
                            <strong>Your team</strong>
                        </div>
                        <div className={licenceLine}>
                            <span className={licenceLabel}>Status</span>
                            <strong>Ready to apply</strong>
                        </div>
                        <span className="absolute -right-3 -bottom-4 -rotate-10 rounded-[6px] border-4 border-double border-secondary-dark bg-white px-[0.85rem] py-[0.35rem] font-mono text-[0.8rem] font-extrabold tracking-[0.18em] text-lime-ink uppercase">
                            Approved
                        </span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ClinicCta

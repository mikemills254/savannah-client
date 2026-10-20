import { Link } from 'react-router-dom'
import { LuArrowRight } from 'react-icons/lu'
import { RotaPreview } from '../../components/RotaPreview.tsx'
import { cn } from '../../../lib/cn.ts'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { heroAccent, heroActions, heroBtn, heroGrid, heroLede, heroSection, heroTitle } from '../../components/sectionStyles.ts'

const FACTS = ['Weekly hours → 30-min slots', 'Your clinic’s local time', 'Doctors across clinics']

export function ClinicHero() {
    return (
        <section className={cn(heroSection, 'pb-4')} aria-labelledby="fc-hero-heading">
            <div className="site-container">
                <div className={heroGrid}>
                    <div>
                        <Eyebrow mark="dot" className="text-primary-light">
                            For clinics &amp; hospitals
                        </Eyebrow>
                        <h1 id="fc-hero-heading" className={heroTitle}>
                            Fill your doctors’ diaries. <Accent className={heroAccent}>Lose the phone.</Accent>
                        </h1>
                        <p className={heroLede}>
                            Give your clinic its own booking space, set each doctor’s weekly working hours in your local
                            time, and let patients book the open slots themselves.
                        </p>

                        <div className={heroActions}>
                            <Link to="/register?as=clinic" className={cn('btn btn-primary', heroBtn)}>
                                Apply for a clinic space
                                <LuArrowRight size={18} />
                            </Link>
                            <a href="#clinic-steps" className={cn('btn btn-secondary', heroBtn)}>
                                See how it works
                            </a>
                        </div>

                        <ul className="mt-9 mb-0 flex list-none flex-wrap gap-x-5 gap-y-2 border-0 border-t border-dashed border-border px-0 pt-5 pb-0">
                            {FACTS.map((f) => (
                                <li
                                    key={f}
                                    className="inline-flex items-center gap-[0.45rem] font-mono text-[0.7rem] tracking-[0.08em] text-copy-light uppercase before:text-secondary-dark before:content-['✚']"
                                >
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <RotaPreview />
                </div>
            </div>
        </section>
    )
}

export default ClinicHero

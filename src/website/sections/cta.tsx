import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.ts'
import { useHomePath } from '../../hooks/useHomePath.ts'
import { LuArrowRight } from 'react-icons/lu'
import { cn } from '../../lib/cn.ts'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { Lede, SectionHeading } from '../components/section.tsx'
import { ctaBand, ctaBtn, ctaSection } from '../components/sectionStyles.ts'

// "Take a number" ticket with punched sides and a dashed inner border; colour with [--ticket:…]
const ticket =
    'absolute inset-0 m-auto flex h-[150px] w-[260px] flex-col items-center justify-center font-mono text-secondary-content ticket-sides drop-shadow-[0_14px_22px_rgba(0,0,0,0.3)] transition-[rotate,translate] duration-400 ease-spring motion-reduce:transition-none ' +
    'before:absolute before:inset-x-6 before:inset-y-2.5 before:rounded-sm before:border-2 before:border-dashed before:border-[rgba(28,36,6,0.25)]'

export function Cta() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const home = useHomePath()

    return (
        <section className={ctaSection} aria-labelledby="cta-band-heading">
            <div className="site-container">
                <div className={cn('group', ctaBand)}>
                    <div>
                        <Eyebrow className="text-secondary">Your turn</Eyebrow>
                        <SectionHeading id="cta-band-heading" tone="dark" size="lg">
                            Take a <Accent className="text-secondary">number.</Accent>
                        </SectionHeading>
                        <Lede tone="band">
                            Except there’s no queue. Choose your clinic, check your doctor’s open slots, and confirm
                            your time with no phone calls and no waitlists.
                        </Lede>

                        {isAuthenticated ? (
                            <Link to={home} className={cn('btn btn-accent', ctaBtn)}>
                                Go to dashboard
                                <LuArrowRight size={18} />
                            </Link>
                        ) : (
                            <Link to="/auth/register" className={cn('btn btn-accent', ctaBtn)}>
                                Create free account
                                <LuArrowRight size={18} />
                            </Link>
                        )}
                    </div>

                    <div className="relative h-50 w-full max-w-70 justify-self-center" aria-hidden="true">
                        <div className={cn(ticket, '-translate-x-3.5 translate-y-3.5 -rotate-12 opacity-55 [--ticket:#ffffff]')} />
                        <div
                            className={cn(
                                ticket,
                                '-translate-x-1.5 translate-y-1.5 -rotate-5 opacity-85 [--ticket:var(--secondary-light)]',
                            )}
                        />
                        <div
                            className={cn(
                                ticket,
                                'rotate-4 [--ticket:var(--secondary)] group-hover:translate-x-3 group-hover:-translate-y-3.5 group-hover:rotate-10',
                            )}
                        >
                            <span className="text-[0.65rem] tracking-[0.18em] uppercase opacity-75">Now serving</span>
                            <strong className="font-(family-name:--sans) text-[3.25rem] leading-[1.05] font-extrabold tracking-[-0.03em]">
                                You
                            </strong>
                            <small className="text-[0.65rem] tracking-[0.12em] uppercase">Admit one · free</small>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Cta

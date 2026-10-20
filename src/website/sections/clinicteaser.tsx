import { Link } from 'react-router-dom'
import { LuArrowRight, LuCheck } from 'react-icons/lu'
import { RotaPreview } from '../components/RotaPreview.tsx'
import { Accent, Eyebrow } from '../../components/ui.tsx'
import { Lede, SectionHeading } from '../components/section.tsx'
import { sectionPad } from '../components/sectionStyles.ts'

const POINTS = [
    "Set each doctor's weekly hours once; patients see the open slots",
    'Invite your doctors and manage the team from one place',
    'Cancellations free the slot automatically, no phone tag',
]

export function ClinicTeaser() {
    return (
        <section className={sectionPad} aria-labelledby="teaser-heading">
            <div className="site-container grid items-center gap-12 min-[960px]:grid-cols-[0.9fr_1.1fr] min-[960px]:gap-16">
                <div>
                    <Eyebrow className="text-primary-light">For clinics &amp; hospitals</Eyebrow>
                    <SectionHeading id="teaser-heading">
                        Run a clinic? Sit on the <Accent className="text-primary-light">other side of the desk.</Accent>
                    </SectionHeading>
                    <Lede>
                        The same schedule your patients book from is the one your team runs. Pick a day on the rota to
                        see how working hours turn into bookable slots.
                    </Lede>

                    <ul className="mt-7 mb-0 grid list-none gap-[0.7rem] p-0">
                        {POINTS.map((p) => (
                            <li key={p} className="flex items-start gap-[0.6rem] text-[0.95rem] text-copy">
                                <LuCheck size={18} className="mt-0.5 shrink-0 text-secondary-dark" />
                                {p}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/register?as=clinic" className="btn btn-primary">
                            Apply for a clinic space
                            <LuArrowRight size={18} />
                        </Link>
                        <Link to="/for-clinics" className="btn btn-secondary">
                            How it works for clinics
                        </Link>
                    </div>
                </div>

                <RotaPreview />
            </div>
        </section>
    )
}

export default ClinicTeaser

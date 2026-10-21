import { LuArrowDown, LuExternalLink } from 'react-icons/lu'
import { cn } from '../../../lib/cn.ts'
import { swaggerUrl } from '../../../lib/docsLinks.ts'
import { Accent, Eyebrow } from '../../../components/ui.tsx'
import { heroAccent, heroActions, heroBtn, heroLede, heroSection, heroTitle } from '../../components/sectionStyles.ts'
import { TEST_TOTAL } from './testSuite.ts'

const STATS = [
    { value: '7 / 7', label: 'Functional requirements met' },
    { value: String(TEST_TOTAL), label: 'Automated tests on real PostgreSQL' },
    { value: '0', label: 'Double bookings under concurrent requests' },
    { value: '4', label: 'Roles, each with its own workspace' },
]

const STACK = ['FastAPI', 'SQLAlchemy', 'PostgreSQL', 'Redis', 'Alembic', 'React', 'TypeScript', 'Tailwind', 'GitHub Actions']

export function DocsHero() {
    const swagger = swaggerUrl()

    return (
        <section className={cn(heroSection, 'pb-14')} aria-labelledby="docs-hero-heading">
            <div className="site-container relative">
                <Eyebrow mark="dot" className="text-primary-light">
                    Documentation
                </Eyebrow>
                <h1 id="docs-hero-heading" className={cn(heroTitle, 'max-w-[16ch]')}>
                    What’s built, and <Accent className={heroAccent}>how it works.</Accent>
                </h1>
                <p className={cn(heroLede, 'max-w-[44rem]')}>
                    DocConnect is a clinic appointment booking system: a FastAPI and PostgreSQL API, and this React
                    client. This page maps each requirement in the brief to what implements it and the test that checks
                    it, then explains the design and the decisions behind it.
                </p>

                <div className={heroActions}>
                    <a href="#requirements" className={cn('btn btn-primary', heroBtn)}>
                        See the requirements
                        <LuArrowDown size={18} />
                    </a>
                    {swagger && (
                        <a href={swagger} target="_blank" rel="noreferrer" className={cn('btn btn-secondary', heroBtn)}>
                            Open the live API docs
                            <LuExternalLink size={16} />
                        </a>
                    )}
                </div>

                <dl className="mt-12 mb-0 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border min-[860px]:grid-cols-4">
                    {STATS.map((s) => (
                        <div key={s.label} className="bg-white px-5 py-5">
                            <dt className="sr-only">{s.label}</dt>
                            <dd className="m-0 font-mono text-[2rem] leading-none font-bold tracking-[-0.02em] text-primary">
                                {s.value}
                            </dd>
                            <dd className="m-0 mt-2 text-[0.82rem] leading-[1.4] text-copy-light" aria-hidden="true">
                                {s.label}
                            </dd>
                        </div>
                    ))}
                </dl>

                <ul className="mt-6 mb-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0" aria-label="Tech stack">
                    {STACK.map((t) => (
                        <li
                            key={t}
                            className="inline-flex items-center gap-[0.45rem] font-mono text-[0.7rem] tracking-[0.08em] text-copy-light uppercase before:text-secondary-dark before:content-['✚']"
                        >
                            {t}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default DocsHero

import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { Navbar } from '../components/Navbar.tsx'
import { Footer } from '../components/Footer.tsx'
import DocsHero from '../sections/docs/hero.tsx'
import Coverage from '../sections/docs/coverage.tsx'
import Walkthrough from '../sections/docs/walkthrough.tsx'
import Architecture from '../sections/docs/architecture.tsx'
import CodeTour from '../sections/docs/codetour.tsx'
import Accounts from '../sections/docs/accounts.tsx'
import Roles from '../sections/docs/roles.tsx'
import ApiReference from '../sections/docs/api.tsx'
import Quality from '../sections/docs/quality.tsx'
import Decisions from '../sections/docs/decisions.tsx'

const CONTENTS = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'walkthrough', label: 'Try it' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'double-booking', label: 'Double booking', sub: true },
    { id: 'multi-clinic', label: 'Several clinics', sub: true },
    { id: 'live-updates', label: 'Live updates', sub: true },
    { id: 'code', label: 'Code tour' },
    { id: 'accounts', label: 'Accounts & email' },
    { id: 'client', label: 'Web client' },
    { id: 'api', label: 'API reference' },
    { id: 'quality', label: 'Security & testing' },
    { id: 'decisions', label: 'Decisions' },
]

// The top-level section nearest the top of the viewport
function useActiveSection(ids: string[]) {
    const [active, setActive] = useState(ids[0])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                if (visible[0]) setActive(visible[0].target.id)
            },
            // A band near the top of the screen, below the sticky navbar
            { rootMargin: '-90px 0px -65% 0px' },
        )
        ids.forEach((id) => {
            const el = document.getElementById(id)
            if (el) observer.observe(el)
        })
        return () => observer.disconnect()
    }, [ids])

    return active
}

const TOP_LEVEL = CONTENTS.filter((c) => !c.sub).map((c) => c.id)

export function Docs() {
    const active = useActiveSection(TOP_LEVEL)

    useEffect(() => {
        const previous = document.title
        document.title = 'Documentation · DocConnect'
        return () => {
            document.title = previous
        }
    }, [])

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />
            <main className="flex-1">
                <DocsHero />

                <div className="site-container grid grid-cols-[minmax(0,1fr)] gap-10 pb-10 min-[1024px]:grid-cols-[12rem_minmax(0,1fr)] min-[1024px]:gap-14">
                    <nav aria-label="On this page" className="hidden min-[1024px]:block">
                        <div className="sticky top-24">
                            <p className="m-0 mb-3 font-mono text-[0.66rem] font-semibold tracking-[0.14em] text-copy-lighter uppercase">
                                On this page
                            </p>
                            <ul className="m-0 grid list-none gap-0.5 border-0 border-l border-border p-0">
                                {CONTENTS.map((c) => (
                                    <li key={c.id}>
                                        <a
                                            href={`#${c.id}`}
                                            aria-current={active === c.id ? 'location' : undefined}
                                            className={cn(
                                                '-ml-px block border-0 border-l-2 border-transparent py-1.5 text-[0.86rem] transition-colors hover:text-primary',
                                                c.sub ? 'pl-7 text-[0.8rem] text-copy-lighter' : 'pl-4 text-copy-light',
                                                active === c.id && 'border-primary font-semibold text-primary',
                                            )}
                                        >
                                            {c.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </nav>

                    <div className="min-w-0">
                        <Coverage />
                        <Walkthrough />
                        <Architecture />
                        <CodeTour />
                        <Accounts />
                        <Roles />
                        <ApiReference />
                        <Quality />
                        <Decisions />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default Docs

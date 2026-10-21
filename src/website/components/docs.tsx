import type { ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Eyebrow } from '../../components/ui.tsx'

// Building blocks of the /docs page

interface DocSectionProps {
    id: string
    eyebrow: string
    title: ReactNode
    lede?: ReactNode
    children: ReactNode
}

// One chapter of the docs. scroll-mt keeps its heading clear of the sticky navbar.
export function DocSection({ id, eyebrow, title, lede, children }: DocSectionProps) {
    return (
        <section
            id={id}
            aria-labelledby={`${id}-heading`}
            className="scroll-mt-24 border-0 border-t border-border py-14 first:border-t-0 first:pt-2"
        >
            <Eyebrow className="text-primary-light">{eyebrow}</Eyebrow>
            <h2
                id={`${id}-heading`}
                className="m-0 text-[clamp(1.65rem,3.2vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-primary"
            >
                {title}
            </h2>
            {lede && <p className="mt-3 mb-0 max-w-[64ch] text-[1rem] leading-[1.65] text-copy-light">{lede}</p>}
            {/* minmax(0,1fr): a wide table scrolls in its frame instead of widening the page */}
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8">{children}</div>
        </section>
    )
}

export function SubHeading({ children }: { children: ReactNode }) {
    return <h3 className="m-0 mb-3 text-[1.1rem] tracking-[-0.01em] text-copy">{children}</h3>
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('m-0 max-w-[68ch] text-[0.95rem] leading-[1.7] text-copy-light', className)}>{children}</p>
}

// Inline code: endpoints, file names, columns
export function Code({ children }: { children: ReactNode }) {
    return (
        <code className="rounded-[5px] bg-[var(--code-bg)] px-[0.4em] py-[0.1em] font-mono text-[0.84em] break-words text-primary">
            {children}
        </code>
    )
}

export function CodeBlock({ label, children }: { label?: string; children: string }) {
    return (
        <figure className="m-0 overflow-hidden rounded-md bg-ink shadow-md">
            {label && (
                <figcaption className="border-0 border-b border-white/10 px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.12em] text-white/50 uppercase">
                    {label}
                </figcaption>
            )}
            <pre className="m-0 overflow-x-auto p-5 font-mono text-[0.8rem] leading-[1.7] text-white/85">
                <code>{children}</code>
            </pre>
        </figure>
    )
}

interface TableProps {
    head: string[]
    rows: ReactNode[][]
    // Optional per-column classes, e.g. a fixed width or nowrap
    cols?: (string | undefined)[]
    caption?: string
}

// Scrolls sideways inside its own frame on narrow screens, never the page
export function Table({ head, rows, cols = [], caption }: TableProps) {
    return (
        <div className="overflow-x-auto rounded-md border border-border bg-white shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left text-[0.875rem]">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr className="bg-foreground">
                        {head.map((h) => (
                            <th
                                key={h}
                                scope="col"
                                className="border-0 border-b border-border px-4 py-3 font-mono text-[0.68rem] font-semibold tracking-[0.12em] whitespace-nowrap text-copy-lighter uppercase"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="align-top [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-border">
                            {row.map((cell, j) => (
                                <td key={j} className={cn('border-0 px-4 py-3.5 leading-[1.55] text-copy-light', cols[j])}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

type PillTone = 'done' | 'extra' | 'note'

const PILL_TONE: Record<PillTone, string> = {
    done: 'bg-[rgba(186,218,85,0.4)] text-[#3f520c]',
    extra: 'bg-accent-bg text-primary',
    note: 'bg-[rgba(245,197,66,0.3)] text-[#5c4706]',
}

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
    return (
        <span
            className={cn(
                'inline-block rounded-full px-[0.6rem] py-[0.2rem] font-mono text-[0.62rem] font-bold tracking-[0.1em] whitespace-nowrap uppercase',
                PILL_TONE[tone],
            )}
        >
            {children}
        </span>
    )
}

// Numbered steps of a flow (booking, availability, live updates)
export function Steps({ items }: { items: ReactNode[] }) {
    return (
        <ol className="m-0 grid list-none gap-3 p-0">
            {items.map((item, i) => (
                <li key={i} className="flex gap-3.5 text-[0.92rem] leading-[1.6] text-copy-light">
                    <span className="mt-[0.1rem] inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[0.7rem] font-bold text-white">
                        {i + 1}
                    </span>
                    <span>{item}</span>
                </li>
            ))}
        </ol>
    )
}

// White card for a short titled block of content
export function Card({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
    return (
        <article className={cn('rounded-md border border-border bg-white p-5 shadow-sm', className)}>
            <h4 className="m-0 mb-2 text-[0.98rem] text-primary">{title}</h4>
            <div className="text-[0.88rem] leading-[1.6] text-copy-light">{children}</div>
        </article>
    )
}

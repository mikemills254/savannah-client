import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { LuCheck, LuCopy } from 'react-icons/lu'
import { cn } from '../../lib/cn.ts'
import { highlight, type Lang } from '../../lib/highlight.tsx'

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
        } catch {
            // Clipboard blocked (insecure context or permissions): nothing to do
        }
    }
    return (
        <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-white/12 bg-white/5 px-2 py-1 font-mono text-[0.62rem] tracking-[0.08em] text-white/60 uppercase transition-colors hover:bg-white/10 hover:text-white"
            aria-label={copied ? 'Copied' : 'Copy code'}
        >
            {copied ? <LuCheck size={12} /> : <LuCopy size={12} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    )
}

interface CodePanelProps {
    code: string
    lang: Lang
    // File path or label shown in the header
    title?: string
    // Right side of the header, e.g. a status pill
    aside?: ReactNode
    className?: string
}

// A dark code panel with a header, highlighting and a copy button
export function CodePanel({ code, lang, title, aside, className }: CodePanelProps) {
    return (
        <figure className={cn('m-0 flex min-w-0 flex-col overflow-hidden rounded-md bg-ink shadow-md', className)}>
            <figcaption className="flex items-center justify-between gap-3 border-0 border-b border-white/10 px-4 py-2.5">
                <span className="min-w-0 truncate font-mono text-[0.7rem] text-white/60">{title ?? lang}</span>
                <span className="flex shrink-0 items-center gap-2">
                    {aside}
                    <CopyButton text={code} />
                </span>
            </figcaption>
            <pre className="m-0 flex-1 overflow-x-auto p-4 font-mono text-[0.78rem] leading-[1.7] text-white/88">
                <code>{highlight(code, lang)}</code>
            </pre>
        </figure>
    )
}

export interface CodeTab {
    label: string
    file: string
    lang: Lang
    why: ReactNode
    code: string
}

// Tabbed tour through excerpts of the real source
export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
    const [active, setActive] = useState(0)
    const id = useId()
    const tab = tabs[active]

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        e.preventDefault()
        const next = (active + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
        setActive(next)
        document.getElementById(`${id}-tab-${next}`)?.focus()
    }

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div
                role="tablist"
                aria-label="Code samples"
                onKeyDown={onKeyDown}
                className="flex flex-wrap gap-1 border-0 border-b border-border bg-foreground p-2"
            >
                {tabs.map((t, i) => (
                    <button
                        key={t.label}
                        id={`${id}-tab-${i}`}
                        type="button"
                        role="tab"
                        aria-selected={i === active}
                        aria-controls={`${id}-panel`}
                        tabIndex={i === active ? 0 : -1}
                        onClick={() => setActive(i)}
                        className={cn(
                            'shrink-0 rounded-full border-0 px-3.5 py-1.5 text-[0.8rem] font-semibold whitespace-nowrap transition-colors',
                            i === active
                                ? 'bg-primary text-white'
                                : 'bg-transparent text-copy-light hover:bg-accent-bg hover:text-primary',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div
                id={`${id}-panel`}
                role="tabpanel"
                aria-labelledby={`${id}-tab-${active}`}
                className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:p-5"
            >
                <p className="m-0 max-w-[70ch] text-[0.92rem] leading-[1.65] text-copy-light">{tab.why}</p>
                <CodePanel code={tab.code} lang={tab.lang} title={tab.file} />
            </div>
        </div>
    )
}

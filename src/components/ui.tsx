import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

interface EyebrowProps {
    children: ReactNode
    // Leading mark: a short rule (default) or a pulsing status dot
    mark?: 'rule' | 'dot'
    className?: string
}

// Mono, uppercase kicker above headings. Colour it with a text-* class.
export function Eyebrow({ children, mark = 'rule', className }: EyebrowProps) {
    return (
        <p
            className={cn(
                'm-0 mb-4 flex items-center gap-2.5 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em]',
                mark === 'rule'
                    ? 'before:h-0.5 before:w-6 before:bg-current'
                    : 'before:size-2 before:rounded-full before:bg-success before:animate-breathe motion-reduce:before:animate-none',
                className,
            )}
        >
            {children}
        </p>
    )
}

// Serif italic accent inside a heading. Colour it with a text-* class.
export function Accent({ children, className }: { children: ReactNode; className?: string }) {
    return <span className={cn('font-serif font-normal italic tracking-[-0.01em]', className)}>{children}</span>
}

// Small green "Live" pill with a breathing dot
export function LiveBadge({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-success/15 px-2.5 py-1 text-[0.72rem] font-bold text-[#086e30] before:size-1.5 before:rounded-full before:bg-success before:animate-breathe motion-reduce:before:animate-none">
            {children}
        </span>
    )
}

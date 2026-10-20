import type { ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'

// 'light' = on a light background, 'dark' = on a dark (purple) background
type Tone = 'light' | 'dark'

const HEADING_TONE: Record<Tone, string> = {
    light: 'text-primary',
    dark: 'text-white',
}

const HEADING_SIZE = {
    md: 'text-[clamp(2rem,4.5vw,3.25rem)]',
    lg: 'text-[clamp(2.4rem,6vw,3.75rem)]',
}

interface SectionHeadingProps {
    children: ReactNode
    id?: string
    tone?: Tone
    // 'lg' is the bigger CTA-band heading
    size?: keyof typeof HEADING_SIZE
    className?: string
}

// Section h2. Colour comes from `tone`; don't pass text colour/size classes.
export function SectionHeading({ children, id, tone = 'light', size = 'md', className }: SectionHeadingProps) {
    return (
        <h2
            id={id}
            className={cn(
                'm-0 leading-[1.04] font-extrabold tracking-[-0.035em]',
                HEADING_TONE[tone],
                HEADING_SIZE[size],
                className,
            )}
        >
            {children}
        </h2>
    )
}

// 'band' = on the primary CTA band (slightly brighter than 'dark')
const LEDE_TONE = {
    light: 'text-copy-light',
    dark: 'text-white/70',
    band: 'text-white/78',
}

interface LedeProps {
    children: ReactNode
    tone?: keyof typeof LEDE_TONE
    className?: string
}

// Intro paragraph under a section heading. Layout classes (mx-auto, justify-self-*) can go in className.
export function Lede({ children, tone = 'light', className }: LedeProps) {
    return (
        <p className={cn('mt-4 mb-0 max-w-[42ch] text-[1.05rem] leading-[1.6]', LEDE_TONE[tone], className)}>
            {children}
        </p>
    )
}

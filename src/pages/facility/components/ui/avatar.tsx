import type { ReactNode } from 'react'
import { cn } from '../../../../lib/cn.ts'
import { initials } from '../../../../lib/initials.ts'

interface AvatarProps {
    name: string
    muted?: boolean
    // Drawn over the circle, e.g. a status dot
    children?: ReactNode
}

export default function Avatar({ name, muted = false, children }: AvatarProps) {
    return (
        <div
            className={cn(
                'relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                muted ? 'bg-background text-copy-lighter' : 'bg-accent-bg text-primary',
            )}
        >
            {initials(name)}
            {children}
        </div>
    )
}

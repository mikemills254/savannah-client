import type { ReactNode } from 'react'
import { cn } from '../../../../lib/cn.ts'

interface PanelProps {
    title?: string
    action?: ReactNode
    className?: string
    children: ReactNode
}

export default function Panel({ title, action, className, children }: PanelProps) {
    return (
        <section className={cn('rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6', className)}>
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between gap-3">
                    {title && <h2 className="text-base font-bold">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    )
}

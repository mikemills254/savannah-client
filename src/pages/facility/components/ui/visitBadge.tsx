import { cn } from '../../../../lib/cn.ts'
import type { VisitState } from '../../utils/schedule.ts'

const badges: Record<VisitState, { label: string; className: string }> = {
    upcoming: { label: 'Upcoming', className: 'bg-accent-bg text-primary' },
    'in-progress': { label: 'In progress', className: 'bg-secondary-light text-lime-ink' },
    done: { label: 'Done', className: 'bg-background text-copy-lighter' },
    cancelled: { label: 'Cancelled', className: 'bg-error/10 text-error-ink' },
}

export default function VisitBadge({ state }: { state: VisitState }) {
    const badge = badges[state]

    return (
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', badge.className)}>
            {badge.label}
        </span>
    )
}

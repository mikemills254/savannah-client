import { cn } from '../../lib/cn.ts'
import { useLiveStore } from '../../store/useLiveStore.ts'

// Whether the page is getting updates as they happen, for the top bar
export default function LiveBadge({ className }: { className?: string }) {
    const status = useLiveStore((s) => s.status)
    if (status === 'off' || status === 'closed') return null

    const live = status === 'open'
    const label = live ? 'Live' : status === 'connecting' ? 'Connecting…' : 'Reconnecting…'

    return (
        <span
            role="status"
            title={
                live
                    ? 'Bookings, cancellations and changes show up as they happen'
                    : "Reconnecting. What's on screen may be out of date until it's back."
            }
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                live ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning-content',
                className,
            )}
        >
            <span
                className={cn(
                    'size-2 rounded-full',
                    live ? 'animate-breathe bg-success motion-reduce:animate-none' : 'bg-warning',
                )}
            />
            <span className={cn(live && 'sr-only sm:not-sr-only')}>{label}</span>
        </span>
    )
}

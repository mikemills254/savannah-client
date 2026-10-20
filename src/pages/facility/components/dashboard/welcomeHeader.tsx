import { clinicClock, formatDate, formatTime } from '../../utils/clinicTime.ts'

interface WelcomeHeaderProps {
    name: string
    now: Date
    timeZone: string
}

function greeting(minutes: number): string {
    if (minutes < 12 * 60) return 'Good morning'
    if (minutes < 17 * 60) return 'Good afternoon'
    return 'Good evening'
}

export default function WelcomeHeader({ name, now, timeZone }: WelcomeHeaderProps) {
    const firstName = name.split(' ')[0]
    const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                    {greeting(clinicClock(now, timeZone).minutes)}
                    {firstName && `, ${firstName}`}
                </h2>
                <p className="m-0 mt-1 text-sm text-copy-light">
                    {formatDate(now, timeZone, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            <p className="m-0 text-sm text-copy-light">
                Clinic time <span className="font-semibold tabular-nums text-copy">{formatTime(now, timeZone)}</span>
                {/* Only worth pointing out when the viewer's own clock says something else */}
                {viewerZone !== timeZone && ` · ${timeZone.replace(/_/g, ' ')}`}
            </p>
        </div>
    )
}

// Facility pages show every time in the clinic's timezone, not the viewer's:
// working hours are stored as clinic-local times, and an admin travelling
// abroad still needs to see the clinic's day.

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const DAY_MS = 24 * 60 * 60 * 1000

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
    let formatter = formatters.get(timeZone)
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone,
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        })
        formatters.set(timeZone, formatter)
    }
    return formatter
}

export interface ClinicClock {
    // "2026-10-18", for grouping by calendar day
    day: string
    // Monday = 0, matching working hours
    weekday: number
    // Minutes since the clinic's midnight
    minutes: number
}

export function clinicClock(date: Date | string, timeZone: string): ClinicClock {
    const parts: Record<string, string> = {}
    for (const { type, value } of formatterFor(timeZone).formatToParts(new Date(date))) {
        parts[type] = value
    }

    return {
        day: `${parts.year}-${parts.month}-${parts.day}`,
        weekday: WEEKDAYS.indexOf(parts.weekday),
        minutes: Number(parts.hour) * 60 + Number(parts.minute),
    }
}

// "08:30:00" -> 510
export function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

// 510 -> "08:30"
export function formatMinutes(total: number): string {
    const hours = String(Math.floor(total / 60)).padStart(2, '0')
    const minutes = String(total % 60).padStart(2, '0')
    return `${hours}:${minutes}`
}

export function formatTime(date: Date | string, timeZone: string): string {
    return formatMinutes(clinicClock(date, timeZone).minutes)
}

export function formatDate(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('en-GB', { timeZone, ...options }).format(date)
}

// "Sat 24 Oct, 13:00", in the clinic's time
export function visitWhen(startsAt: string, timeZone: string): string {
    const day = formatDate(new Date(startsAt), timeZone, { weekday: 'short', day: 'numeric', month: 'short' })
    return `${day}, ${formatTime(startsAt, timeZone)}`
}

// "Today", "Tomorrow", "Yesterday", otherwise "Tue 20 Oct"
export function dayHeading(date: Date | string, now: Date, timeZone: string): string {
    const day = clinicClock(date, timeZone).day
    if (day === clinicClock(now, timeZone).day) return 'Today'
    if (day === clinicClock(new Date(now.getTime() + DAY_MS), timeZone).day) return 'Tomorrow'
    if (day === clinicClock(new Date(now.getTime() - DAY_MS), timeZone).day) return 'Yesterday'
    return formatDate(new Date(date), timeZone, { weekday: 'short', day: 'numeric', month: 'short' })
}

// 450 -> "7h 30m"
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    if (rest === 0) return `${hours}h`
    return hours === 0 ? `${rest}m` : `${hours}h ${rest}m`
}

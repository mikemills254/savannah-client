import type { ISlot, IWorkingHour } from '../../types/facility.types.ts'
import { clinicClock, DAY_MS, formatDate, formatMinutes, toMinutes } from '../../pages/facility/utils/clinicTime.ts'

// Every appointment is 30 minutes, starting on the hour or half hour
export const SLOT_MINUTES = 30

// How far ahead a day can be picked
export const BOOKING_DAYS = 14

export interface BookingDay {
    // Clinic-local date, "2026-10-20"
    key: string
    // Monday = 0, matching working hours
    weekday: number
    // "Tue"
    label: string
    // 20
    date: number
    // "Oct"
    month: string
}

// Today and the days after it, in the clinic's calendar
export function upcomingDays(now: Date, timeZone: string, count = BOOKING_DAYS): BookingDay[] {
    return Array.from({ length: count }, (_, offset) => {
        const date = new Date(now.getTime() + offset * DAY_MS)
        const clock = clinicClock(date, timeZone)
        return {
            key: clock.day,
            weekday: clock.weekday,
            label: formatDate(date, timeZone, { weekday: 'short' }),
            date: Number(clock.day.slice(8)),
            month: formatDate(date, timeZone, { month: 'short' }),
        }
    })
}

// A clinic-local date from the API ("2026-10-20") as a day tab. Noon UTC keeps the
// calendar date the same whatever the browser's timezone.
export function bookingDay(key: string): BookingDay {
    const date = new Date(`${key}T12:00:00Z`)
    return {
        key,
        weekday: (date.getUTCDay() + 6) % 7,
        label: formatDate(date, 'UTC', { weekday: 'short' }),
        date: date.getUTCDate(),
        month: formatDate(date, 'UTC', { month: 'short' }),
    }
}

// Start of every slot (minutes after the clinic's midnight) in a doctor's shifts on a weekday
export function slotMinutes(hours: IWorkingHour[], weekday: number): number[] {
    const starts: number[] = []
    for (const shift of hours) {
        if (shift.weekday !== weekday) continue
        const end = toMinutes(shift.end_time)
        for (let minutes = toMinutes(shift.start_time); minutes + SLOT_MINUTES <= end; minutes += SLOT_MINUTES) {
            starts.push(minutes)
        }
    }
    return starts.sort((a, b) => a - b)
}

export type SlotState = 'open' | 'taken' | 'past'

export interface SlotCell {
    minutes: number
    // "09:30"
    label: string
    // The bookable slot, when it's open
    slot: ISlot | null
    state: SlotState
}

// The doctor's slots that day, marked open, taken or already gone. The API only
// lists free slots, so the rest of the working day is what's been booked.
export function slotCells(
    minutes: number[],
    available: ISlot[],
    dayKey: string,
    now: Date,
    timeZone: string,
): SlotCell[] {
    const open = new Map(available.map((slot) => [clinicClock(slot.starts_at, timeZone).minutes, slot]))
    const clock = clinicClock(now, timeZone)

    return minutes.map((start) => {
        const slot = open.get(start) ?? null
        const past = dayKey === clock.day && start <= clock.minutes
        return {
            minutes: start,
            label: formatMinutes(start),
            slot,
            state: slot ? 'open' : past ? 'past' : 'taken',
        }
    })
}

export function partOfDay(minutes: number): 'Morning' | 'Afternoon' | 'Evening' {
    if (minutes < 12 * 60) return 'Morning'
    if (minutes < 17 * 60) return 'Afternoon'
    return 'Evening'
}

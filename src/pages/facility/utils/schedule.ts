import type { IAppointment, IMember, IWorkingHour } from '../../../types/facility.types.ts'
import { clinicClock, formatMinutes, toMinutes } from './clinicTime.ts'

export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export type VisitState = 'upcoming' | 'in-progress' | 'done' | 'cancelled'

// The API only records BOOKED or CANCELLED; whether a visit has happened comes from the clock
export function visitState(appointment: IAppointment, now: Date): VisitState {
    if (appointment.status === 'CANCELLED') return 'cancelled'

    const time = now.getTime()
    if (time >= new Date(appointment.ends_at).getTime()) return 'done'
    if (time >= new Date(appointment.starts_at).getTime()) return 'in-progress'
    return 'upcoming'
}

export type DutyState = 'on-duty' | 'later' | 'finished' | 'off' | 'no-hours' | 'inactive'

export interface DoctorDuty {
    state: DutyState
    label: string
}

export interface RosterEntry {
    doctor: IMember
    duty: DoctorDuty
}

export function doctorDuty(doctor: IMember, hours: IWorkingHour[], now: Date, timeZone: string): DoctorDuty {
    if (!doctor.is_active) return { state: 'inactive', label: 'Deactivated' }

    const own = hours.filter((hour) => hour.doctor_id === doctor.id)
    // Without working hours a doctor has no slots, so patients can't book them
    if (own.length === 0) return { state: 'no-hours', label: 'No working hours set' }

    const clock = clinicClock(now, timeZone)
    const shifts = own
        .filter((hour) => hour.weekday === clock.weekday)
        .map((hour) => ({ start: toMinutes(hour.start_time), end: toMinutes(hour.end_time) }))
        .sort((a, b) => a.start - b.start)

    if (shifts.length === 0) return { state: 'off', label: 'Off today' }

    const current = shifts.find((shift) => clock.minutes >= shift.start && clock.minutes < shift.end)
    if (current) return { state: 'on-duty', label: `On duty until ${formatMinutes(current.end)}` }

    // A split shift can leave a gap mid-day, so look for the next one rather than the first
    const next = shifts.find((shift) => shift.start > clock.minutes)
    if (next) return { state: 'later', label: `Starts at ${formatMinutes(next.start)}` }

    return { state: 'finished', label: `Finished at ${formatMinutes(shifts[shifts.length - 1].end)}` }
}

// "08:00–16:00"
export function shiftRange(shift: IWorkingHour): string {
    return `${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}`
}

export function weeklyMinutes(hours: IWorkingHour[]): number {
    return hours.reduce((sum, hour) => sum + toMinutes(hour.end_time) - toMinutes(hour.start_time), 0)
}

// Why a new shift can't be saved, or null when it can. Times are "HH:MM"
export function shiftProblem(start: string, end: string, sameDay: IWorkingHour[]): string | null {
    if (!start || !end) return 'Pick a start and an end time'

    const from = toMinutes(start)
    const to = toMinutes(end)
    if (from >= to) return 'The shift has to end after it starts'

    const clash = sameDay.find((hour) => from < toMinutes(hour.end_time) && to > toMinutes(hour.start_time))
    if (clash) return `Overlaps the ${shiftRange(clash)} shift`

    return null
}

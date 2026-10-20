import type { IAppointment, IPerson } from '../../types/facility.types.ts'

// "in 25 min", "in 3 h 20 min", "in 2 days 4 h"
export function countdown(startsAt: string, now: Date): string {
    const minutes = Math.round((new Date(startsAt).getTime() - now.getTime()) / 60_000)
    if (minutes <= 0) return 'Now'
    if (minutes < 60) return `in ${minutes} min`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return minutes % 60 ? `in ${hours} h ${minutes % 60} min` : `in ${hours} h`

    const days = Math.floor(hours / 24)
    const rest = hours % 24
    return `in ${days} ${days === 1 ? 'day' : 'days'}${rest ? ` ${rest} h` : ''}`
}

// A visit is upcoming until it ends, so one in progress still shows as next
export function isUpcoming(appointment: IAppointment, now: Date): boolean {
    return appointment.status === 'BOOKED' && new Date(appointment.ends_at) > now
}

// "the clinic" when staff did it, null when the patient did (or it wasn't recorded)
export function staffName(appointment: IAppointment, person: IPerson | null): string | null {
    if (!person || person.id === appointment.patient.id) return null
    return person.id === appointment.doctor.id ? appointment.doctor.name : person.name
}

// Short code printed on the ticket stub, "7F3A2C"
export function visitCode(appointment: IAppointment): string {
    return appointment.id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

import type { IAppointment } from './facility.types'

export type AppointmentEventType = 'appointment.booked' | 'appointment.cancelled' | 'appointment.rescheduled'

// An `appointment` event on GET /events: one the user can see was booked,
// cancelled or rescheduled, by them (in any tab) or someone else
export interface IAppointmentEvent {
    type: AppointmentEventType
    // Who made the change
    actor_id: string
    // As GET /appointments/{id} returns it, after the change
    appointment: IAppointment
}

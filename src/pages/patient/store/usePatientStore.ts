import { create } from 'zustand'
import {
    handleCancelAppointment,
    handleGetAppointment,
    handleGetMyAppointments,
    handleRescheduleAppointment,
} from '../../../api/booking.ts'
import { unwrap } from '../../../api/request.ts'
import type { IAppointment } from '../../../types/facility.types.ts'

type Status = 'idle' | 'loading' | 'ready' | 'error'

function upsert(items: IAppointment[], item: IAppointment): IAppointment[] {
    return items.some((existing) => existing.id === item.id)
        ? items.map((existing) => (existing.id === item.id ? item : existing))
        : [...items, item]
}

// The signed-in patient's visits, shared by their pages and kept current by
// live updates. Actions throw an ApiError with the server's message.
interface PatientState {
    loadedFor: string | null
    status: Status
    error: string | null
    appointments: IAppointment[]
    // Shows the cached list straight away when it's the same user, and re-reads it behind
    load: (userId: string) => Promise<void>
    // Re-reads visits, e.g. after the live connection dropped and events may have been missed
    refresh: () => Promise<void>
    // One visit, read fresh from the server
    fetchOne: (id: string, signal?: AbortSignal) => Promise<IAppointment>
    // A visit as the server now has it, from a live update or a response
    applyAppointment: (appointment: IAppointment) => void
    cancel: (id: string, reason: string) => Promise<IAppointment>
    reschedule: (id: string, startsAt: string) => Promise<IAppointment>
}

export const usePatientStore = create<PatientState>((set, get) => {
    const applyAppointment = (appointment: IAppointment) =>
        set((state) => ({ appointments: upsert(state.appointments, appointment) }))

    const read = async (userId: string) => {
        try {
            const appointments = unwrap(await handleGetMyAppointments())
            if (get().loadedFor !== userId) return
            set({ status: 'ready', error: null, appointments })
        } catch (error) {
            if (get().loadedFor !== userId) return
            // A failed background refresh keeps the list already on screen
            if (get().status !== 'ready') {
                set({ status: 'error', error: error instanceof Error ? error.message : 'Could not load your visits' })
            }
        }
    }

    return {
        loadedFor: null,
        status: 'idle',
        error: null,
        appointments: [],

        load: async (userId) => {
            if (get().loadedFor !== userId || get().status === 'error') {
                set({ loadedFor: userId, status: 'loading', error: null, appointments: [] })
            }
            await read(userId)
        },

        refresh: async () => {
            const { loadedFor, status } = get()
            if (loadedFor && status === 'ready') await read(loadedFor)
        },

        fetchOne: async (id, signal) => {
            const appointment = unwrap(await handleGetAppointment(id, signal))
            applyAppointment(appointment)
            return appointment
        },

        applyAppointment,

        cancel: async (id, reason) => {
            const appointment = unwrap(await handleCancelAppointment(id, reason))
            applyAppointment(appointment)
            return appointment
        },

        reschedule: async (id, startsAt) => {
            const appointment = unwrap(await handleRescheduleAppointment(id, startsAt))
            applyAppointment(appointment)
            return appointment
        },
    }
})

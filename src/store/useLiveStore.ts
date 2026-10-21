import { create } from 'zustand'
import type { StreamStatus } from '../lib/eventStream.ts'
import type { AppointmentEventType } from '../types/events.types.ts'

// How long a row someone else just changed stays marked
const FRESH_MS = 90_000

// The live connection, and appointments that changed while the user watched
interface LiveState {
    // 'off' when there's no stream: signed out, or an account without updates
    status: StreamStatus | 'off'
    // By appointment id: what happened to it, so its row can say "New" or "Moved"
    fresh: Record<string, AppointmentEventType>
    setStatus: (status: StreamStatus | 'off') => void
    markFresh: (id: string, type: AppointmentEventType) => void
}

const expiry = new Map<string, number>()

export const useLiveStore = create<LiveState>((set) => ({
    status: 'off',
    fresh: {},

    setStatus: (status) => set({ status }),

    markFresh: (id, type) => {
        window.clearTimeout(expiry.get(id))
        set((state) => ({ fresh: { ...state.fresh, [id]: type } }))
        expiry.set(
            id,
            window.setTimeout(() => {
                expiry.delete(id)
                set((state) => {
                    const fresh = { ...state.fresh }
                    delete fresh[id]
                    return { fresh }
                })
            }, FRESH_MS),
        )
    },
}))

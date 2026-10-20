import { useEffect, useState } from 'react'
import { handleGetAvailability } from '../../api/booking.ts'
import type { ISlot } from '../../types/facility.types.ts'

interface Result {
    // doctor|day|version the result belongs to
    key: string
    slots: ISlot[]
    error: string | null
}

// A doctor's free slots on a clinic-local day. While a newer request is in
// flight the previous slots for the same day stay on screen (loading is true),
// so a refresh doesn't blank the grid.
export function useAvailability(doctorId: string | null, day: string | null) {
    const [version, setVersion] = useState(0)
    const [result, setResult] = useState<Result | null>(null)

    useEffect(() => {
        if (!doctorId || !day) return
        const controller = new AbortController()
        const key = `${doctorId}|${day}|${version}`

        handleGetAvailability(doctorId, day, controller.signal).then((response) => {
            if (controller.signal.aborted) return
            setResult({
                key,
                slots: response.data?.available_slots ?? [],
                error: response.success ? null : response.message,
            })
        })
        return () => controller.abort()
    }, [doctorId, day, version])

    const dayKey = doctorId && day ? `${doctorId}|${day}|` : null
    const sameDay = dayKey !== null && result !== null && result.key.startsWith(dayKey)

    return {
        loading: dayKey !== null && result?.key !== `${dayKey}${version}`,
        slots: sameDay ? result.slots : [],
        error: sameDay ? result.error : null,
        reload: () => setVersion((v) => v + 1),
    }
}

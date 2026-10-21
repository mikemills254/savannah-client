import { useEffect, useState } from 'react'
import { handleGetFacilityAvailability } from '../../api/booking.ts'
import type { IFacilityAvailability } from '../../types/facility.types.ts'
import { BOOKING_DAYS } from './slots.ts'

interface Result {
    // facility|version the result belongs to
    key: string
    data: IFacilityAvailability | null
    error: string | null
}

// Every doctor's free slots at a clinic over the booking window. While a reload
// is in flight the previous data stays on screen (loading is true), so a
// refresh after booking doesn't blank the page.
export function useFacilityAvailability(facilityId: string | null) {
    const [version, setVersion] = useState(0)
    const [result, setResult] = useState<Result | null>(null)

    useEffect(() => {
        if (!facilityId) return
        const controller = new AbortController()
        const key = `${facilityId}|${version}`

        handleGetFacilityAvailability(facilityId, BOOKING_DAYS, controller.signal).then((response) => {
            if (controller.signal.aborted) return
            setResult({
                key,
                data: response.data ?? null,
                error: response.success ? null : response.message,
            })
        })
        return () => controller.abort()
    }, [facilityId, version])

    const prefix = facilityId ? `${facilityId}|` : null
    const sameFacility = prefix !== null && result !== null && result.key.startsWith(prefix)

    return {
        loading: prefix !== null && result?.key !== `${prefix}${version}`,
        data: sameFacility ? result.data : null,
        error: sameFacility ? result.error : null,
        reload: () => setVersion((v) => v + 1),
    }
}

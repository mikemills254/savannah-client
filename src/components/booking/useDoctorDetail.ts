import { useEffect, useState } from 'react'
import { handleGetDoctor } from '../../api/booking.ts'
import type { IDoctorDetail } from '../../types/facility.types.ts'

interface Result {
    // doctor|facility the result belongs to
    key: string
    doctor: IDoctorDetail | null
    error: string | null
}

// A bookable doctor with their weekly hours at a clinic (a doctor can work at
// several). error is set once they stop taking bookings there (removed, or the
// clinic closed), which the API reports as not found.
export function useDoctorDetail(doctorId: string | null, facilityId?: string) {
    const [result, setResult] = useState<Result | null>(null)
    const key = `${doctorId}|${facilityId ?? ''}`

    useEffect(() => {
        if (!doctorId) return
        const controller = new AbortController()
        const requested = `${doctorId}|${facilityId ?? ''}`
        handleGetDoctor(doctorId, facilityId, controller.signal).then((response) => {
            if (controller.signal.aborted) return
            setResult({
                key: requested,
                doctor: response.data ?? null,
                error: response.success ? null : response.message,
            })
        })
        return () => controller.abort()
    }, [doctorId, facilityId])

    const current = result?.key === key ? result : null
    return {
        loading: doctorId !== null && current === null,
        doctor: current?.doctor ?? null,
        error: current?.error ?? null,
    }
}

import { useEffect, useState } from 'react'
import { handleGetDoctor } from '../../api/booking.ts'
import type { IDoctorDetail } from '../../types/facility.types.ts'

interface Result {
    doctorId: string
    doctor: IDoctorDetail | null
    error: string | null
}

// A bookable doctor with their weekly hours. error is set once they stop
// taking bookings (deactivated, or their clinic closed), which the API reports as not found.
export function useDoctorDetail(doctorId: string | null) {
    const [result, setResult] = useState<Result | null>(null)

    useEffect(() => {
        if (!doctorId) return
        const controller = new AbortController()
        handleGetDoctor(doctorId, controller.signal).then((response) => {
            if (controller.signal.aborted) return
            setResult({ doctorId, doctor: response.data ?? null, error: response.success ? null : response.message })
        })
        return () => controller.abort()
    }, [doctorId])

    const current = result?.doctorId === doctorId ? result : null
    return {
        loading: doctorId !== null && current === null,
        doctor: current?.doctor ?? null,
        error: current?.error ?? null,
    }
}

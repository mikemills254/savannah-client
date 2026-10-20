import { useClock } from '../../../hooks/useClock.ts'
import { useAuthStore } from '../../../store/useAuthStore.ts'

// The clinic's timezone, and a clock that ticks often enough for statuses
// that change on the minute
export function useClinicNow() {
    const facilityZone = useAuthStore((s) => s.user?.facility?.timezone)
    const now = useClock(15_000)

    return {
        now,
        timeZone: facilityZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
}

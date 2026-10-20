import { useEffect, useState } from 'react'

// Re-renders every interval (a second by default); drives clocks and countdowns
export function useClock(intervalMs = 1000) {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), intervalMs)
        return () => window.clearInterval(id)
    }, [intervalMs])
    return now
}

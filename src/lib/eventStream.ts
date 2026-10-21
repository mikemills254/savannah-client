// Server-Sent Events read with fetch rather than EventSource, so the token goes
// in the Authorization header like every other request (EventSource can't set
// headers, and a token in the URL ends up in logs). Reconnects with backoff
// until stopped.

export interface StreamEvent {
    event: string
    data: string
}

// open: connected and subscribed (the server sent `ready`)
export type StreamStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

interface StreamOptions {
    url: string
    // Read on every (re)connect, so a new login's token is used
    token: () => string | null
    onEvent: (event: StreamEvent) => void
    onStatus: (status: StreamStatus) => void
    // The server refused this token (401). Reconnecting stops.
    onUnauthorized: (token: string) => void
}

const MIN_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000
// The server sends a heartbeat every 15s. Nothing for this long means the
// connection died without closing (a laptop waking from sleep, a dropped proxy).
const STALE_MS = 45_000

// Opens the stream and returns a function that closes it for good
export function openEventStream({ url, token, onEvent, onStatus, onUnauthorized }: StreamOptions): () => void {
    let stopped = false
    let controller: AbortController | null = null
    let retryTimer: number | undefined
    // Failed attempts since the last `ready`, for the backoff
    let failures = 0
    let baseDelay = MIN_DELAY_MS

    const stop = () => {
        stopped = true
        controller?.abort()
        window.clearTimeout(retryTimer)
        window.removeEventListener('online', reconnectNow)
        document.removeEventListener('visibilitychange', onVisible)
        onStatus('closed')
    }

    const scheduleReconnect = () => {
        if (stopped) return
        // Full jitter, so a server restart isn't hit by every browser at once
        const delay = Math.min(MAX_DELAY_MS, baseDelay * 2 ** failures) * (0.5 + Math.random() / 2)
        failures += 1
        onStatus('reconnecting')
        retryTimer = window.setTimeout(connect, delay)
    }

    // Back online, or back to the tab: no point waiting out the backoff
    function reconnectNow() {
        if (stopped || retryTimer === undefined) return
        window.clearTimeout(retryTimer)
        retryTimer = undefined
        connect()
    }

    function onVisible() {
        if (document.visibilityState === 'visible') reconnectNow()
    }

    async function connect() {
        retryTimer = undefined
        const current = token()
        if (stopped || !current) return
        const attempt = new AbortController()
        controller = attempt
        onStatus(failures === 0 ? 'connecting' : 'reconnecting')

        let watchdog: number | undefined
        const resetWatchdog = () => {
            window.clearTimeout(watchdog)
            watchdog = window.setTimeout(() => attempt.abort(), STALE_MS)
        }

        try {
            resetWatchdog()
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${current}`, Accept: 'text/event-stream' },
                cache: 'no-store',
                signal: attempt.signal,
            })
            if (response.status === 401) {
                stop()
                onUnauthorized(current)
                return
            }
            // This account has no live updates; asking again won't change that
            if (response.status === 403) {
                stop()
                return
            }
            if (!response.ok || !response.body) throw new Error(`Event stream failed (${response.status})`)

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
            let buffer = ''
            let event = ''
            let data: string[] = []

            for (;;) {
                const { value, done } = await reader.read()
                if (done) break
                resetWatchdog()
                buffer += value

                let end: number
                while ((end = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, end).replace(/\r$/, '')
                    buffer = buffer.slice(end + 1)

                    // A blank line ends an event
                    if (line === '') {
                        if (data.length > 0) {
                            const name = event || 'message'
                            if (name === 'ready') {
                                failures = 0
                                onStatus('open')
                            }
                            onEvent({ event: name, data: data.join('\n') })
                        }
                        event = ''
                        data = []
                        continue
                    }
                    // Comments are heartbeats
                    if (line.startsWith(':')) continue

                    const colon = line.indexOf(':')
                    const field = colon < 0 ? line : line.slice(0, colon)
                    const fieldValue = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '')
                    if (field === 'event') event = fieldValue
                    else if (field === 'data') data.push(fieldValue)
                    else if (field === 'retry' && /^\d+$/.test(fieldValue)) baseDelay = Math.max(MIN_DELAY_MS, Number(fieldValue))
                }
            }
        } catch {
            // Network errors, aborts and bad statuses all end in a reconnect below
        } finally {
            window.clearTimeout(watchdog)
        }

        // The server ends the stream when the token expires, and on restarts
        if (!stopped && controller === attempt) scheduleReconnect()
    }

    window.addEventListener('online', reconnectNow)
    document.addEventListener('visibilitychange', onVisible)
    connect()
    return stop
}

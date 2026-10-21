import { useSyncExternalStore } from 'react'

// Chrome, Edge and Android's prompt event; not in the DOM typings
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Opened from the home screen or app list rather than a browser tab
export function isStandalone(): boolean {
    if (typeof window === 'undefined') return false
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        // iOS Safari's own flag
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
}

// iPhones and iPads have no install prompt: people add the app from the Share menu
export function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false
    // iPadOS reports itself as a Mac with a touch screen
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

// Called once at startup, before React renders: the browser fires the event
// early and only once per page load
export function captureInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
        // Keep the browser's own mini-infobar away; our banner asks instead
        event.preventDefault()
        deferred = event as BeforeInstallPromptEvent
        notify()
    })
    window.addEventListener('appinstalled', () => {
        deferred = null
        installed = true
        notify()
    })
}

// Shows the browser's install dialog; true when the user accepted
export async function promptInstall(): Promise<boolean> {
    const event = deferred
    if (!event) return false
    // The event can only be used once
    deferred = null
    notify()
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'accepted') installed = true
    notify()
    return outcome === 'accepted'
}

interface InstallState {
    // The browser can show its install dialog now
    canPrompt: boolean
    // Installed during this visit, or already running as the installed app
    installed: boolean
}

let snapshot: InstallState = { canPrompt: false, installed: false }
const getSnapshot = () => {
    const next = { canPrompt: deferred !== null, installed: installed || isStandalone() }
    // Same object while nothing changed, as useSyncExternalStore requires
    if (next.canPrompt !== snapshot.canPrompt || next.installed !== snapshot.installed) snapshot = next
    return snapshot
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function useInstallState(): InstallState {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// Production only: in development the service worker would keep serving stale builds
export function registerServiceWorker() {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
            console.warn('Service worker registration failed', error)
        })
    })
}

// FNV-1a: small, stable string hash used to derive decorative IDs and barcodes.
export function hashString(input: string): number {
    let h = 0x811c9dc5
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i)
        h = Math.imul(h, 0x01000193)
    }
    return h >>> 0
}

// "jane.doe@mail.com" -> "j•••e@mail.com"
export function maskEmail(email: string): string {
    const [user, domain] = email.trim().split('@')
    if (!user || !domain) return email.trim()
    const masked = user.length <= 2 ? `${user[0]}•••` : `${user[0]}•••${user[user.length - 1]}`
    return `${masked}@${domain}`
}

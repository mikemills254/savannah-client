// Deterministic barcode from a seed, so the same ticket always prints the same bars
export function barcode(seed: number, count = 30) {
    const bars: { x: number; w: number }[] = []
    let s = seed || 1
    let x = 0
    for (let i = 0; i < count; i++) {
        s = (Math.imul(s, 1103515245) + 12345) >>> 0
        const w = 1 + ((s >>> 16) % 3)
        bars.push({ x, w })
        x += w + 1 + ((s >>> 8) % 2)
    }
    return { bars, width: x }
}

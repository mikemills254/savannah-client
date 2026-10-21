// The API's interactive Swagger docs, served at /docs on the API's origin.
// Null when VITE_API_BASE_URL isn't a full URL, since the origin is then unknown.
export function swaggerUrl(): string | null {
    const base = import.meta.env.VITE_API_BASE_URL ?? ''
    return /^https?:\/\//.test(base) ? `${new URL(base).origin}/docs` : null
}

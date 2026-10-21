/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Base URL of the FastAPI server; leave unset in dev to use the Vite proxy
    readonly VITE_API_BASE_URL?: string
    // OAuth web client id from Google Cloud, the same one the server's GOOGLE_CLIENT_ID holds.
    // Unset hides the Google button
    readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

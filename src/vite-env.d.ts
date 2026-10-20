/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Base URL of the FastAPI server; leave unset in dev to use the Vite proxy
    readonly VITE_API_BASE_URL?: string
    readonly VITE_API_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

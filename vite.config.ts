import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The config runs before Vite loads .env, so read it here
  const { VITE_API_BASE_URL } = loadEnv(mode, __dirname)
  // Just the server ("http://localhost:8000/api/v1" -> "http://localhost:8000")
  const target = /^https?:\/\//.test(VITE_API_BASE_URL ?? '') ? new URL(VITE_API_BASE_URL).origin : undefined

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@website': path.resolve(__dirname, './src/website'),
      },
    },
    server: {
      // In dev the client calls /api/v1/... on its own origin (see src/lib/api.ts)
      // and this forwards it to the server, streams included. Every API path is
      // under /api, so none clash with app pages such as /auth/login.
      proxy: target ? { '/api': { target, changeOrigin: true } } : undefined,
    },
  }
})

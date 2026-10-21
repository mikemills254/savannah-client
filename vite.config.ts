import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const { VITE_API_BASE_URL } = loadEnv(mode, __dirname)
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

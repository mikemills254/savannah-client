import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
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
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/facilities': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/doctors': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/appointments': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

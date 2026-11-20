import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const rawBase = env.VITE_BASE_PATH?.trim()
  const base = rawBase
    ? rawBase.endsWith('/')
      ? rawBase
      : `${rawBase}/`
    : './'

  return {
    base,
    plugins: [react(), tailwindcss()],
  }
})

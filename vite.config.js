import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: { '/nube': { target: 'https://bckagestion.proyecto.sbs', changeOrigin: true, rewrite: (path) => path.replace('/nube', '') } },
  },
  preview: { port: 3000, strictPort: true },
  test: {
    environment: 'jsdom',
    env: { VITE_API_URL: 'http://localhost:8000' },
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    css: false,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Respeita a porta atribuída pelo ambiente (ex.: previews); padrão 5173.
const port = Number(process.env.PORT) || 5173

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port },
})

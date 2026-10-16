import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api requests go to the local Express server (server/dev.js), which runs the same
// /api files that Vercel deploys as serverless functions.
const apiProxy = { '/api': { target: `http://localhost:${process.env.API_PORT || 3001}`, changeOrigin: true } }

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: false, proxy: apiProxy },
  preview: { proxy: apiProxy },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          charts: ['recharts'],
        },
      },
    },
  },
})

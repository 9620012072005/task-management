import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true, // Ensure proper routing for React Router in development
  },
  build: {
    outDir: 'dist', // Ensure Vercel knows where the build files are
  }
})

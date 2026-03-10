import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'gsap': ['gsap'],
          'motion': ['framer-motion'],
        }
      }
    }
  }
})

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  // Serve the project root as the public dir so /png/* resolves directly
  publicDir: '.',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: 'index.html',
        treatment01: 'treatments/01-collage/index.html',
      },
      output: {
        manualChunks: {
          three: ['three'],
          gsap:  ['gsap'],
        },
      },
    },
  },
})

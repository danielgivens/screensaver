import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/screensaver/',
  plugins: [
    tailwindcss(),
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: 'index.html',
        treatment01: 'treatments/01-collage/index.html',
        treatment02: 'treatments/02-paintbrush/index.html',
        treatment03: 'treatments/03-speedread/index.html',
        treatment04: 'treatments/04-sphere/index.html',
        treatment05: 'treatments/05-feedback/index.html',
      },
      output: {
        manualChunks: {
          three: ['three'],
          gsap:  ['gsap'],
          pixi:  ['pixi.js'],
        },
      },
    },
  },
})

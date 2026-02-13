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
        main:       'index.html',
        scrapbook:  'scrapbook/index.html',
        paintbrush: 'paintbrush/index.html',
        speedread:  'speed-read/index.html',
        sphere:     'sphere/index.html',
        feedback:   'feedback/index.html',
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

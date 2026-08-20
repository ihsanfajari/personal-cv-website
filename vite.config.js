import { defineConfig } from 'vite';

// Two pages: the CV island at / and the time trial at /off-road-racing.
// Keeping them as separate entries means the CV page never downloads the
// race world, and vice versa.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        race: 'off-road-racing/index.html',
      },
    },
    chunkSizeWarningLimit: 900,
  },
});

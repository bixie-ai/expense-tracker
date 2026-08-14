import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 4200,
    proxy: {
      '/legacy-app': {
        target: 'http://localhost:4201',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/legacy-app/, ''),
      },
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-router-dom')) {
              return 'router';
            }
            if (
              id.includes('react-dom') ||
              id.includes('/react/') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor';
            }
          }
        },
      },
    },
  },
});

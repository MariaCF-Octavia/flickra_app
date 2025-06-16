import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  assetsInclude: ['**/*.mov', '**/*.mp4'],
  build: {
    rollupOptions: {
      external: ['@supabase/supabase-js', 'uuid']
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '*.ngrok-free.app',
      '.ngrok-free.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/create-checkout': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
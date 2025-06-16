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
    host: true, // This allows access from your phone
    port: 5173, // You can change this port if needed
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '*.ngrok-free.app',  // This allows all ngrok domains
      '.ngrok-free.app'    // Alternative format
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false, // Add this if you're having HTTPS issues
      },
      '/create-checkout': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  assetsInclude: ['**/*.mov', '**/*.mp4', '**/*.png'], // Added PNG support
  resolve: {
    alias: {
      '@': '/src', // Add path alias for cleaner imports
      '@assets': '/src/assets' // Specific alias for assets
    }
  },
  optimizeDeps: {
    include: ['react-hot-toast'] // Ensure proper dependency optimization
  },
  build: {
    rollupOptions: {
      external: ['react-hot-toast'], // Externalize to prevent build errors
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]' // Better asset handling
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      '192.168.0.25',
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
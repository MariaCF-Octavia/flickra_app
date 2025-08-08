import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  assetsInclude: ['**/*.mov', '**/*.mp4', '**/*.png'],
  resolve: {
    alias: {
      '@': '/src',
      '@assets': '/src/assets',
      // Add this explicit resolution for react-hot-toast
      'react-hot-toast': 'react-hot-toast/dist/index.mjs'
    }
  },
  optimizeDeps: {
    include: [
      'react-hot-toast',
      // Add these if you're using them
      '@vitejs/plugin-react',
      'react',
      'react-dom'
    ],
    exclude: [] // Add any problematic dependencies here
  },
  build: {
    commonjsOptions: {
      include: [/react-hot-toast/, /node_modules/]
    },
    rollupOptions: {
      external: [], // Remove react-hot-toast from external
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Add this to handle ESM packages correctly
        format: 'esm',
        interop: 'auto'
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
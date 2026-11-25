import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // lucide-react@1.57.0 currently ships without the ESM file declared in
    // its package metadata. Its CommonJS bundle is present and contains the
    // same icon exports, so resolve imports to that working entry point.
    alias: {
      '@': path.resolve(__dirname, './src'),
      'lucide-react': 'lucide-react/dist/cjs/lucide-react.js',
      'motion/react': 'framer-motion',
    },
  },
  server: {
    host: true,
    port: 3000,
    open: false,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion', 'gsap'],
          'vendor-pdf': ['jspdf'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});

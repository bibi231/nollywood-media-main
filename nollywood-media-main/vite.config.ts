import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['hls.js', 'react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'video-player': ['hls.js'],
          'admin': [
            './src/pages/admin/Dashboard.tsx',
            './src/pages/admin/Films.tsx',
            './src/pages/admin/Users.tsx',
            './src/pages/admin/Analytics.tsx',
            './src/pages/admin/Settings.tsx',
          ],
          'studio': [
            './src/pages/studio/Dashboard.tsx',
            './src/pages/studio/Analytics.tsx',
            './src/pages/studio/Content.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    target: 'es2015',
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
Object.assign(process.env, env);

export default defineConfig({
  plugins: [react()],
  server: {
    // Vercel serverless endpoints map to /api/...
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['hls.js', 'react', 'react-dom', 'react-router-dom'],
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Letting Vite/Rollup handle chunking natively to prevent circular dependency bugs
      }
    },
    minify: 'esbuild',
    target: 'es2015',
  },
});

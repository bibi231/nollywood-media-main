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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@supabase') || id.includes('hls.js')) {
              return 'heavy-libs';
            }
            return 'vendor'; // Fallback for other node_modules
          }
        }
      }
    },
    minify: 'esbuild',
    target: 'es2015',
  },
});

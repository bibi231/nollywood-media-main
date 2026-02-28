import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
Object.assign(process.env, env);

// Simple Vite Plugin to mock Vercel dev API handling
function apiLocalProxy() {
  return {
    name: 'vercel-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        try {
          // Normalize the path manually against the filesystem
          const urlObj = new URL('http://localhost' + req.url);
          let apiPath = urlObj.pathname.replace(/^\/api\//, '');

          // Basic Vercel routing
          if (apiPath === 'query') apiPath = 'query';
          else if (apiPath.startsWith('auth/')) apiPath = apiPath;
          else if (apiPath.startsWith('films/')) apiPath = apiPath;
          else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: `Not mapped: ${req.url}` }));
          }

          const resolvedPath = path.resolve(__dirname, 'api', apiPath + '.ts');
          if (!fs.existsSync(resolvedPath)) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: `Not found: ${resolvedPath}` }));
          }

          // Use Vite's TS runner to execute the file
          const module = await server.ssrLoadModule(resolvedPath);

          // Mocking VercelReq/Res properties
          if (!req.body && req.method !== 'GET') {
            await new Promise(resolve => {
              let body = '';
              req.on('data', chunk => body += chunk.toString());
              req.on('end', () => {
                if (body) try { req.body = JSON.parse(body); } catch (e) { }
                resolve();
              });
            });
          }
          req.query = Object.fromEntries(urlObj.searchParams);

          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          await module.default(req, res);
        } catch (err) {
          console.error('API Error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiLocalProxy()],
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
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

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

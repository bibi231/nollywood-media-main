// vite.config.ts
import { defineConfig } from "file:///C:/Users/bgadz/Downloads/nollywood-media-main/nollywood-media-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/bgadz/Downloads/nollywood-media-main/nollywood-media-main/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "C:\\Users\\bgadz\\Downloads\\nollywood-media-main\\nollywood-media-main";
function apiLocalProxy() {
  return {
    name: "vercel-api-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        try {
          const urlObj = new URL("http://localhost" + req.url);
          let apiPath = urlObj.pathname.replace(/^\/api\//, "");
          if (apiPath === "query") apiPath = "query";
          else if (apiPath.startsWith("auth/")) apiPath = apiPath;
          else if (apiPath.startsWith("films/")) apiPath = apiPath;
          else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: `Not mapped: ${req.url}` }));
          }
          const resolvedPath = path.resolve(__vite_injected_original_dirname, "api", apiPath + ".ts");
          if (!fs.existsSync(resolvedPath)) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: `Not found: ${resolvedPath}` }));
          }
          const module = await server.ssrLoadModule(resolvedPath);
          if (!req.body && req.method !== "GET") {
            await new Promise((resolve) => {
              let body = "";
              req.on("data", (chunk) => body += chunk.toString());
              req.on("end", () => {
                if (body) try {
                  req.body = JSON.parse(body);
                } catch (e) {
                }
                resolve();
              });
            });
          }
          req.query = Object.fromEntries(urlObj.searchParams);
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };
          await module.default(req, res);
        } catch (err) {
          console.error("API Error:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), apiLocalProxy()],
  server: {
    // Vercel serverless endpoints map to /api/...
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    include: ["hls.js", "react", "react-dom", "react-router-dom"],
    exclude: ["lucide-react"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "video-player": ["hls.js"],
          "admin": [
            "./src/pages/admin/Dashboard.tsx",
            "./src/pages/admin/Films.tsx",
            "./src/pages/admin/Users.tsx",
            "./src/pages/admin/Analytics.tsx",
            "./src/pages/admin/Settings.tsx"
          ],
          "studio": [
            "./src/pages/studio/Dashboard.tsx",
            "./src/pages/studio/Analytics.tsx",
            "./src/pages/studio/Content.tsx"
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: "esbuild",
    target: "es2015"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxiZ2FkelxcXFxEb3dubG9hZHNcXFxcbm9sbHl3b29kLW1lZGlhLW1haW5cXFxcbm9sbHl3b29kLW1lZGlhLW1haW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGJnYWR6XFxcXERvd25sb2Fkc1xcXFxub2xseXdvb2QtbWVkaWEtbWFpblxcXFxub2xseXdvb2QtbWVkaWEtbWFpblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYmdhZHovRG93bmxvYWRzL25vbGx5d29vZC1tZWRpYS1tYWluL25vbGx5d29vZC1tZWRpYS1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbi8vIFNpbXBsZSBWaXRlIFBsdWdpbiB0byBtb2NrIFZlcmNlbCBkZXYgQVBJIGhhbmRsaW5nXG5mdW5jdGlvbiBhcGlMb2NhbFByb3h5KCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2ZXJjZWwtYXBpLXByb3h5JyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICBpZiAoIXJlcS51cmw/LnN0YXJ0c1dpdGgoJy9hcGkvJykpIHJldHVybiBuZXh0KCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBwYXRoIG1hbnVhbGx5IGFnYWluc3QgdGhlIGZpbGVzeXN0ZW1cbiAgICAgICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKCdodHRwOi8vbG9jYWxob3N0JyArIHJlcS51cmwpO1xuICAgICAgICAgIGxldCBhcGlQYXRoID0gdXJsT2JqLnBhdGhuYW1lLnJlcGxhY2UoL15cXC9hcGlcXC8vLCAnJyk7XG5cbiAgICAgICAgICAvLyBCYXNpYyBWZXJjZWwgcm91dGluZ1xuICAgICAgICAgIGlmIChhcGlQYXRoID09PSAncXVlcnknKSBhcGlQYXRoID0gJ3F1ZXJ5JztcbiAgICAgICAgICBlbHNlIGlmIChhcGlQYXRoLnN0YXJ0c1dpdGgoJ2F1dGgvJykpIGFwaVBhdGggPSBhcGlQYXRoO1xuICAgICAgICAgIGVsc2UgaWYgKGFwaVBhdGguc3RhcnRzV2l0aCgnZmlsbXMvJykpIGFwaVBhdGggPSBhcGlQYXRoO1xuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBgTm90IG1hcHBlZDogJHtyZXEudXJsfWAgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdhcGknLCBhcGlQYXRoICsgJy50cycpO1xuICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhyZXNvbHZlZFBhdGgpKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNDtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGBOb3QgZm91bmQ6ICR7cmVzb2x2ZWRQYXRofWAgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFVzZSBWaXRlJ3MgVFMgcnVubmVyIHRvIGV4ZWN1dGUgdGhlIGZpbGVcbiAgICAgICAgICBjb25zdCBtb2R1bGUgPSBhd2FpdCBzZXJ2ZXIuc3NyTG9hZE1vZHVsZShyZXNvbHZlZFBhdGgpO1xuXG4gICAgICAgICAgLy8gTW9ja2luZyBWZXJjZWxSZXEvUmVzIHByb3BlcnRpZXNcbiAgICAgICAgICBpZiAoIXJlcS5ib2R5ICYmIHJlcS5tZXRob2QgIT09ICdHRVQnKSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcbiAgICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4gYm9keSArPSBjaHVuay50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGJvZHkpIHRyeSB7IHJlcS5ib2R5ID0gSlNPTi5wYXJzZShib2R5KTsgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXEucXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsT2JqLnNlYXJjaFBhcmFtcyk7XG5cbiAgICAgICAgICByZXMuc3RhdHVzID0gKGNvZGUpID0+IHsgcmVzLnN0YXR1c0NvZGUgPSBjb2RlOyByZXR1cm4gcmVzOyB9O1xuICAgICAgICAgIHJlcy5qc29uID0gKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgYXdhaXQgbW9kdWxlLmRlZmF1bHQocmVxLCByZXMpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdBUEkgRXJyb3I6JywgZXJyKTtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpTG9jYWxQcm94eSgpXSxcbiAgc2VydmVyOiB7XG4gICAgLy8gVmVyY2VsIHNlcnZlcmxlc3MgZW5kcG9pbnRzIG1hcCB0byAvYXBpLy4uLlxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydobHMuanMnLCAncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuXG4gICAgICAgICAgJ3ZpZGVvLXBsYXllcic6IFsnaGxzLmpzJ10sXG4gICAgICAgICAgJ2FkbWluJzogW1xuICAgICAgICAgICAgJy4vc3JjL3BhZ2VzL2FkbWluL0Rhc2hib2FyZC50c3gnLFxuICAgICAgICAgICAgJy4vc3JjL3BhZ2VzL2FkbWluL0ZpbG1zLnRzeCcsXG4gICAgICAgICAgICAnLi9zcmMvcGFnZXMvYWRtaW4vVXNlcnMudHN4JyxcbiAgICAgICAgICAgICcuL3NyYy9wYWdlcy9hZG1pbi9BbmFseXRpY3MudHN4JyxcbiAgICAgICAgICAgICcuL3NyYy9wYWdlcy9hZG1pbi9TZXR0aW5ncy50c3gnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgJ3N0dWRpbyc6IFtcbiAgICAgICAgICAgICcuL3NyYy9wYWdlcy9zdHVkaW8vRGFzaGJvYXJkLnRzeCcsXG4gICAgICAgICAgICAnLi9zcmMvcGFnZXMvc3R1ZGlvL0FuYWx5dGljcy50c3gnLFxuICAgICAgICAgICAgJy4vc3JjL3BhZ2VzL3N0dWRpby9Db250ZW50LnRzeCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMCxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9ZLFNBQVMsb0JBQW9CO0FBQ2phLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxRQUFRO0FBSGYsSUFBTSxtQ0FBbUM7QUFPekMsU0FBUyxnQkFBZ0I7QUFDdkIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sZ0JBQWdCLFFBQVE7QUFDdEIsYUFBTyxZQUFZLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUztBQUMvQyxZQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsT0FBTyxFQUFHLFFBQU8sS0FBSztBQUMvQyxZQUFJO0FBRUYsZ0JBQU0sU0FBUyxJQUFJLElBQUkscUJBQXFCLElBQUksR0FBRztBQUNuRCxjQUFJLFVBQVUsT0FBTyxTQUFTLFFBQVEsWUFBWSxFQUFFO0FBR3BELGNBQUksWUFBWSxRQUFTLFdBQVU7QUFBQSxtQkFDMUIsUUFBUSxXQUFXLE9BQU8sRUFBRyxXQUFVO0FBQUEsbUJBQ3ZDLFFBQVEsV0FBVyxRQUFRLEVBQUcsV0FBVTtBQUFBLGVBQzVDO0FBQ0gsZ0JBQUksYUFBYTtBQUNqQixtQkFBTyxJQUFJ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

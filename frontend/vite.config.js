import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

function dashboardEntry() {
  const middleware = (server) => {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/")) {
        req.url = "/dashboard.html" + url.search;
      }
      next();
    });
  };
  return { name: "dashboard-entry", configureServer: middleware, configurePreviewServer: middleware };
}
export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL(".", import.meta.url));
  const env = loadEnv(mode, envDir, "");
  const target = env.BACKEND_PROXY_URL || "http://localhost:5000";
  const proxy = {
    "/api": { target, changeOrigin: true },
    "/socket.io": { target, ws: true, changeOrigin: true },
  };

  return {
    envDir,
    plugins: [dashboardEntry(), react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
    build: {
      rollupOptions: {
        input: {
          website: fileURLToPath(new URL("./index.html", import.meta.url)),
          dashboard: fileURLToPath(new URL("./dashboard.html", import.meta.url)),
        },
      },
    },
  };
});

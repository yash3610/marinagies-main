import { defineConfig } from "vite";
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
const proxy = {
  "/api": { target: "http://localhost:5000", changeOrigin: true },
  "/socket.io": { target: "http://localhost:5000", ws: true, changeOrigin: true },
};
export default defineConfig({
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
});

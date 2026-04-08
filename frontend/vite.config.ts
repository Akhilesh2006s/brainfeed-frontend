import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // Match Vite’s default so `npm run dev` + `/api` proxy work without extra config
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        // Dev: local backend (`cd backend && npm start`, default PORT=3001). For Railway, set VITE_API_URL in `.env.development` instead of using the proxy.
        // Use IPv4 + long timeouts so large uploads (PDF / cover → Cloudinary) don’t hit net::ERR_CONNECTION_RESET.
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
        timeout: 180000,
        proxyTimeout: 180000,
      },
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

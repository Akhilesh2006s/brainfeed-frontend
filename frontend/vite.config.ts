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
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
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

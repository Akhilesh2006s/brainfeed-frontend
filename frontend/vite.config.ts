import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
        target: "https://brainfeed-backend-production-ab6d.up.railway.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  // NOTE: `componentTagger()` can be memory-hungry on Windows; keep it opt-in.
  // Enable only if you explicitly set VITE_ENABLE_TAGGER=1
  plugins: [
    react(),
    mode === "development" && process.env.VITE_ENABLE_TAGGER === "1" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

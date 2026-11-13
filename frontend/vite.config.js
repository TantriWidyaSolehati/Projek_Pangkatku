import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".trycloudflare.com"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, "/");
          if (moduleId.includes("/node_modules/react/") || moduleId.includes("/node_modules/react-dom/") || moduleId.includes("/node_modules/scheduler/")) return "vendor-react";
          if (moduleId.includes("/node_modules/katex/")) return "vendor-math";
          if (moduleId.includes("/node_modules/framer-motion/")) return "vendor-motion";
          if (moduleId.includes("/node_modules/lucide-react/")) return "vendor-icons";
          if (moduleId.includes("/node_modules/@supabase/")) return "vendor-supabase";
        },
      },
    },
  },
});

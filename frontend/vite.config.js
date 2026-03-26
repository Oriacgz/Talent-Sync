import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2015",
    minify: "terser",
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("react") || id.includes("scheduler")) {
            return "vendor-react";
          }
          if (id.includes("recharts")) {
            return "vendor-recharts";
          }
          if (id.includes("three") || id.includes("@react-three")) {
            return "vendor-three";
          }
          if (id.includes("gsap")) {
            return "vendor-gsap";
          }
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("lenis")) {
            return "vendor-lenis";
          }

          return undefined;
        },
      },
    },
  },
});

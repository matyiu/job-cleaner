import { defineConfig } from "vite";
import { resolve } from "path";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";

export default defineConfig({
  plugins: [
    crx({ manifest })
  ],
  build: {
    minify: process.env.NODE_ENV === "production",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
    },
  },
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ]
    }
  }
});

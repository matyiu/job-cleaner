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
  },
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ]
    }
  }
});

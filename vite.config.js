import { defineConfig } from "vite";
import { resolve } from "path";
import fs from 'fs';

export default defineConfig({
  plugins: [
    {
      name: "manifest-entry",
      writeBundle(options, bundle) {
        const manifestPath = resolve(__dirname, 'manifest.json');
        const distManifest = resolve(options.dir, 'manifest.json');

        let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        manifest.content_scripts.forEach(config => {
          config.js = config.js.map(path => {
            const absolutePath = resolve(__dirname, path);

            for (const [key, value] of Object.entries(bundle)) {
              if (value.facadeModuleId === absolutePath) {
                return key;
              }
            }

            return path;
          })
        })

        console.log(bundle);

        fs.writeFileSync(distManifest, JSON.stringify(manifest, null, 2));
      }
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "./popup.html"),
        content: resolve(__dirname, "./src/content.ts"),
      },
    }
  },
});

import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  "name": "Job Cleaner",
  "description": "",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": [
    "storage"
  ],
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/jobs/search/*"],
      "js": ["./src/content.ts"]
    }
  ]
})

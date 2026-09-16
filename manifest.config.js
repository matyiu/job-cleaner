import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  "name": "Job Cleaner",
  "description": "Job Cleaner v1.0.1",
  "version": "1.0.1",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": [
    "storage"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://www.linkedin.com/jobs/search/*",
        "https://www.linkedin.com/jobs/search-results/*"
      ],
      "js": ["./src/content.ts"]
    }
  ]
})

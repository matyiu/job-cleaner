import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  "name": "Job Cleaner",
  "description": "Job Cleaner v1.0.5",
  "version": "1.0.5",

  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-disabled-16.png",
      "32": "icons/icon-disabled-32.png",
      "48": "icons/icon-disabled-48.png",
      "128": "icons/icon-disabled-128.png"
    }
  },
  "background": {
    "service_worker": "src/background.ts"
  },
  "permissions": [
    "storage",
    "tabs"
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


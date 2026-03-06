# Job Cleaner - Chrome Extension

Extension to automatically filter LinkedIn jobs based on blacklisted keywords and companies to avoid wasting time on offers not fitting the user.

I'm building this extension because the filtering logic inside LinkedIn is limited and sometimes it displays jobs that are not relevant to my skills and experience. The biggest limiter is that the boolean filter is not applied to job descriptions. I've tried other extensions but I've found the same limit and sometimes they are painfully slow.

The other reason for building this extension is just for learning how to build a Chrome extension.

## Features

- **Keyword Filtering** - Hide jobs based on keywords in job titles and descriptions
- **Company Filtering** - Hide jobs from specific companies
- **Whitelist** - Create exceptions to show jobs even if they match blocked keywords
- **Persistent Storage** - All settings are synced across your Chrome profile using `chrome.storage.sync` (except the hidden job list due to limits in the number of items stored)
- **Real-time Filtering** - Automatically filters jobs as they load on the page
- **Automatic Detection** - Uses MutationObserver to detect new jobs loaded dynamically as you scroll

## Manual Installation

1. Build the extension:
   ```bash
   npm run build
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** in the top right corner

4. Click **Load unpacked** and select the `dist` directory in this project

5. The extension icon will appear in your Chrome toolbar

6. Navigate to [LinkedIn Jobs Search](https://www.linkedin.com/jobs/search/) and click the extension icon to configure the filters

## Local Development Setup

```bash
# Install dependencies
yarn install

# Watch mode - automatically rebuilds on file changes
yarn run watch

# Build for production
yarn run build
```

For watch mode:
1. Run `yarn run watch`
2. Load the `dist` folder in Chrome (see Manual Installation steps)
3. Make changes to source files - the extension will rebuild automatically
4. Click the extension reload button in Chrome to see changes

## Build Instructions

```bash
npm run build
```

The built extension will be in the `dist/` directory. Load this directory into Chrome as described in the Manual Installation section.

## Technical Details

### Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **@crxjs/vite-plugin** - Chrome Extension manifest generation
- **Chrome Extension APIs** - Manifest V3

### Architecture

- `content.ts` - Content script that runs on LinkedIn Jobs pages
- `popup.ts` - Popup UI logic for managing filters
- `JobParser.ts` - Parses job elements from the DOM
- `Job.ts` - Job entity with filtering logic
- `JobState.ts` - In-memory job state management
- `Storage.ts` - Chrome storage abstraction
- `Config.ts` - Configuration types
- `DOMObserver.ts` - MutationObserver for detecting DOM changes in the job listings and description as you open each post

### Manifest

- **Manifest Version**: 3
- **Permissions**: `storage`
- **Content Scripts**: Runs on `https://www.linkedin.com/jobs/search/*`

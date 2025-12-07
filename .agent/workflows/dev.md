---
description: Start development with hot-reload for Chrome extension
---

# Development Workflow

## Prerequisites
- Chrome/Edge browser with Developer Mode enabled
- Extension loaded from `./dist` folder

## Steps

// turbo
1. Start the build watcher in a terminal:
```bash
npm run build:watch
```

2. Open `chrome://extensions/` in Chrome

3. Enable **Developer mode** (toggle in top right)

4. Click **Load unpacked** and select the `dist` folder

5. Navigate to `https://is.mendelu.cz/auth/` - the extension will auto-reload when you save files

## How it works

- `npm run build:watch` uses Vite to rebuild on file changes
- `public/hot-reload.js` is a background service worker that polls for build changes
- When a change is detected, it reloads all `is.mendelu.cz` tabs and the extension itself

## Troubleshooting

- If hot-reload stops working, go to `chrome://extensions/` and click the refresh icon on the extension
- Check the service worker console for `[hot-reload]` logs

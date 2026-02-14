# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

reIS (REIS.mendelu) is a Chrome browser extension that simplifies the MENDELU university Information System (IS Mendelu) for students. Built with WXT, it injects an iframe containing a React app into IS Mendelu pages. All processing is client-side — no student data is intercepted or stored externally.

## Commands

```bash
npm run dev              # WXT dev server
npm run build            # Production build
npm run build:watch      # Watch-mode rebuild
npm run zip              # Create deployable .zip

npm run test             # Vitest watch mode
npm run test:run         # Single test run
npm run test:coverage    # Coverage report (V8)
npm run test:e2e         # Playwright E2E (headless)
npm run test:e2e:headed  # E2E with visible browser

npm run lint             # ESLint
npm run typecheck        # TypeScript strict check
```

Run a single test file: `npx vitest run src/store/slices/__tests__/someSlice.test.ts`

## Architecture

### Extension Structure (WXT)
- **Content script** (`src/entrypoints/content.ts`) — injects an iframe into IS Mendelu pages
- **Iframe app** (`src/entrypoints/main/`) — React 19 app rendered inside the iframe
- **Injector** (`src/injector/`) — DOM manipulation, iframe lifecycle, postMessage IPC between content script and app
- Manifest is generated from `wxt.config.ts` (never hand-edited)

### State & Storage (3-Tier)
1. **Zustand** (in-memory, reactive) — all UI reads go through `useAppStore` synchronously
2. **IndexedDB** via `IndexedDBService` — persistent heavy data, survives reloads
3. **Chrome Sync** — small user settings that follow across devices

Store uses the **slice pattern**: `src/store/slices/create*Slice.ts` composed into `useAppStore.ts`.

### Data Flow
- `src/api/` — stateless fetch functions (network only)
- `src/services/sync/` — background sync orchestrator (IS Mendelu → IndexedDB → Zustand)
- Components read from store synchronously; background sync is the only authorized writer to persistent state

### Dual-Language (CZ/EN)
- Language-sensitive data stored as `{ cz: Data, en: Data }`
- Sync services fetch both languages in parallel for instant switching
- Internal code uses `'cs'`/`'en'`; IS Mendelu API uses `'cz'`/`'en'` — mapping applied in API layer
- UI strings via `useTranslation()` hook reading from `src/i18n/locales/{cs,en}.json`

## Iron Rules (from `.agent/rules/charlie-munger.md`)

These are enforced by linting and project convention:

- **NO `localStorage`/`sessionStorage`** — use `IndexedDBService`
- **NO proxy/re-export files** — import directly from implementation files
- **NO `useEffect` for data fetching** — fetch in services/store, not components
- **NO custom CSS** — use DaisyUI semantic classes (`btn-primary`, `bg-base-200`)
- **NO generic state** — all state lives in Zustand slices
- **Max 200 lines per file** — split if larger
- **Direct imports only** — no middleman re-export barrels; import from the specific file
- **Test first** — write a failing test before implementation

## Tech Stack

- **Framework**: WXT (Web Extension Toolkit)
- **UI**: React 19 + Tailwind CSS 4 + DaisyUI 5
- **State**: Zustand (sliced) + Immer
- **Storage**: IndexedDB (`idb`) + Chrome Storage API
- **Testing**: Vitest + happy-dom (unit), Playwright (E2E)
- **Language**: TypeScript (strict mode)
- **Path alias**: `@/*` → `src/*`

## Key Directories

| Path | Purpose |
|------|---------|
| `src/entrypoints/` | WXT entry points (content script, main iframe app) |
| `src/components/` | Feature UI (Calendar, Exams, SubjectFileDrawer, etc.) |
| `src/store/slices/` | Zustand domain slices (schedule, exam, files, i18n, theme, sync) |
| `src/services/` | Business logic: `storage/` (IDB), `sync/` (background sync) |
| `src/api/` | Network fetch functions per domain |
| `src/injector/` | Content script DOM injection and IPC |
| `src/hooks/` | React hooks (prefer store hooks for data) |
| `src/types/` | TypeScript type definitions |
| `.agent/` | Project rules, workflows, and agent personas |

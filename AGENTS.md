# AGENTS.md: The Lattice & Map

> [!IMPORTANT]
> **READ THIS FIRST.** This key context overrides all pre-training assumptions.
> **DO NOT** ask "how do I do X?". **LOOK** at the map below.

## 1. The Munger Inversions (Strict Constraints)
*   **NO `localStorage`**: It is BANNED. Use **`IndexedDBService`** for persistence.
*   **NO Proxy Imports**: Do NOT import from `src/utils/index.ts`. Import from `src/utils/validation/index.ts`.
*   **NO `useEffect` Fetching**: Data fetching MUST happen in `services/` or `components/` via signals/triggers, NOT raw `useEffect`.
*   **NO Utility Soup**: Do NOT write custom CSS. Use **DaisyUI** classes (`btn btn-primary`).
*   **NO Generic State**: State MUST be in **Zustand** slices (`src/store/slices/`).

## 2. The Tech Stack Lattice
*   **Framework**: [WXT](https://wxt.dev) (Web Extension Framework)
*   **UI**: React 19 + Tailwind CSS 4 + DaisyUI 5
*   **State**: Zustand (Sliced Pattern) + Immer
*   **Storage**: IndexedDB (IDB) + Chrome Sync (Settings)
*   **Testing**: Vitest (Unit) + Playwright (E2E)

## 3. The Compressed Project Map (Source of Truth)
| Path | Purpose |
| :--- | :--- |
| **`src/entrypoints/`** | **WXT Entries**. `content.ts` (DOM injection), `background.ts` (Worker), `main/` (Iframe UI). |
| **`src/components/`** | **Feature UI**. `Calendar/`, `Exams/`, `SubjectFileDrawer/`. (Business logic implies folder). |
| **`src/store/`** | **Global State**. `useAppStore.ts` (Root), `slices/` (Domain logic: `scheduleSlice`, `examSlice`). |
| **`src/services/`** | **Business Logic**. `storage/` (IDB), `sync/` (IS->DB), `bridge/` (Content<->Main), `logger/`. |
| **`src/api/`** | **Network**. `client.ts` (Fetch wrapper), `endpoints/`. Fetching ONLY. |
| **`src/injector/`** | **DOM Manipulation**. Scripts that run on the IS Mendelu page to inject buttons/iframes. |
| **`src/hooks/`** | **React Hooks**. `useTheme`, `useSort`. Prefer Store hooks for data. |
| **`src/utils/`** | **Helpers**. `date.ts`, `validation/`, `format.ts`. Pure functions only. |
| **`src/types/`** | **TypeScript**. `app.ts` (Global), `api.ts`, `storage.ts`. |

## 4. The Knowledge Base (Deep Context)
| File | Purpose |
| :--- | :--- |
| **`.agent/rules/charlie-munger.md`** | **The Constitution**. Immutable laws of the workspace. |
| **`.agent/rules/wxt_architecture.md`** | **Framework**. Deep dive into WXT config and entrypoints. |
| **`.agent/rules/storage_architecture.md`** | **Storage**. Detailed 3-Tier architecture specs. |
| **`.agent/workflows/feature-loop.md`** | **Process**. The step-by-step feature lifecycle. |

## 5. Agent Protocol
1.  **Check the Map**: Is there already a component for this? (e.g., `CalendarEventCard`).
2.  **Check the Law**: Are you using `localStorage`? (Stop. Use `IndexedDBService`).
3.  **Check the Agent**:
    *   **@arch-guardian** owns the Plan.
    *   **@seymour** owns the Test.
    *   **@craftsman** owns the Code.

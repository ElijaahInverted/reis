import type { ThemeSlice, AppSlice, Theme } from '../types';
import { IndexedDBService } from '../../services/storage';
import { syncService } from '../../services/sync';

const STORAGE_KEY = "reis_theme";
const DEFAULT_THEME: Theme = "mendelu";

export const createThemeSlice: AppSlice<ThemeSlice> = (set) => ({
    theme: DEFAULT_THEME,
    isThemeLoading: true,
    loadTheme: async () => {
        try {
            const storedTheme = await IndexedDBService.get("meta", STORAGE_KEY) as Theme | undefined;
            const theme = (storedTheme === "mendelu" || storedTheme === "mendelu-dark") ? storedTheme : DEFAULT_THEME;
            
            set({ theme, isThemeLoading: false });
            document.documentElement.setAttribute("data-theme", theme);
        } catch (e) {
            console.error("[ThemeSlice] Failed to load theme:", e);
            set({ isThemeLoading: false });
        }
    },
    setTheme: async (newTheme: Theme) => {
        try {
            await IndexedDBService.set("meta", STORAGE_KEY, newTheme);
            set({ theme: newTheme });
            document.documentElement.setAttribute("data-theme", newTheme);
            
            // Trigger global refresh for other components/tabs
            syncService.triggerRefresh('THEME_UPDATE');
            
            // Cross-context sync
            const bc = new BroadcastChannel('reis_theme_sync');
            bc.postMessage(newTheme);
            bc.close();
        } catch (e) {
            console.error("[ThemeSlice] Failed to set theme:", e);
        }
    },
});

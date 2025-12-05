/**
 * StorageService - Abstraction over localStorage for type-safe data persistence.
 * 
 * Pattern: Stale-while-revalidate
 * - Read from storage immediately (instant UI)
 * - Sync updates in background every 5 minutes
 */

export const StorageService = {
    /**
     * Get a value from localStorage, parsed as JSON.
     * Returns null if key doesn't exist or parsing fails.
     */
    get<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            console.warn(`[StorageService] Failed to parse key "${key}":`, error);
            return null;
        }
    },

    /**
     * Set a value in localStorage as JSON.
     */
    set<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`[StorageService] Failed to set key "${key}":`, error);
            // Could be quota exceeded - handle gracefully
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn('[StorageService] Storage quota exceeded. Consider clearing old data.');
            }
        }
    },

    /**
     * Remove a key from localStorage.
     */
    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`[StorageService] Failed to remove key "${key}":`, error);
        }
    },

    /**
     * Check if a key exists in localStorage.
     */
    has(key: string): boolean {
        return localStorage.getItem(key) !== null;
    },

    /**
     * Get all keys matching a prefix.
     * Useful for iterating over subject files.
     */
    getKeysWithPrefix(prefix: string): string[] {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    },

    /**
     * Clear all reis-related keys from storage.
     * Useful for logout or data reset.
     */
    clearAll(): void {
        const keysToRemove = this.getKeysWithPrefix('reis_');
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[StorageService] Cleared ${keysToRemove.length} keys`);
    },
};

import { fetchWithAuth, BASE_URL } from "../api/client";
import { StorageService } from "../services/storage";
import { STORAGE_KEYS } from "../services/storage/keys";

export interface UserParams {
    studium: string;
    obdobi: string;
}

interface CachedUserParams {
    data: UserParams;
    timestamp: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getUserParams(): Promise<UserParams | null> {
    console.debug('[getUserParams] Starting fetch');

    // 1. Try to get from cache
    try {
        const cached = await StorageService.getAsync<CachedUserParams>(STORAGE_KEYS.USER_PARAMS);

        if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            console.debug('[getUserParams] Returning cached params:', cached.data);
            return cached.data;
        }
        console.debug('[getUserParams] Cache miss or expired');
    } catch (e) {
        console.warn("[getUserParams] Failed to read from cache", e);
    }

    // 2. Fetch from IS
    try {
        console.debug('[getUserParams] Fetching from IS...');
        // Fetching the main auth page usually redirects or contains links with the current period and study ID
        // A reliable place to find these is often the "Student" page or similar.
        // Let's try fetching the main student page which usually has these links.
        const response = await fetchWithAuth(`${BASE_URL}/auth/student/studium.pl`);
        const html = await response.text();

        // Parse the HTML to find links containing studium=...;obdobi=...
        // Example: .../auth/student/terminy_seznam.pl?studium=XXXXXX;obdobi=XXX;lang=cz
        const regex = /studium=(\d+);obdobi=(\d+)/;
        const match = html.match(regex);

        if (match && match[1] && match[2]) {
            const params: UserParams = {
                studium: match[1],
                obdobi: match[2]
            };

            console.debug('[getUserParams] Parsed params:', params);

            // Cache the result
            await StorageService.setAsync<CachedUserParams>(STORAGE_KEYS.USER_PARAMS, {
                data: params,
                timestamp: Date.now()
            });

            return params;
        }

        console.debug('[getUserParams] No params found in HTML response');
    } catch (error) {
        console.error("[getUserParams] Failed to fetch user params:", error);
    }

    return null;
}

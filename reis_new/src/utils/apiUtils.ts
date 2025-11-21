import type { FileObject, StoredSubject } from "../types/calendarTypes";
import { fetchSubjects } from "../api/subjects";
import { fetchFilesFromFolder } from "../api/documents";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to get data from Chrome storage
async function getChromeStorageData<T>(key: string): Promise<T | null> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        return null;
    }

    try {
        const result = await chrome.storage.local.get(key);
        return (result[key] as T) || null;
    } catch (error) {
        console.error(`Error reading from Chrome storage (${key}):`, error);
        return null;
    }
}

// Helper to set data in Chrome storage
async function setChromeStorageData(key: string, value: any): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        return;
    }

    try {
        await chrome.storage.local.set({ [key]: value });
    } catch (error) {
        console.error(`Error writing to Chrome storage (${key}):`, error);
    }
}

export async function getStoredSubject(courseCode: string): Promise<StoredSubject | null> {
    try {
        const now = Date.now();
        const STORAGE_KEY = 'subjects_cache';

        // Try to load from Chrome storage first
        let subjectsCache = await getChromeStorageData<{ data: Record<string, any>, timestamp: number }>(STORAGE_KEY);

        // Check if cache is valid
        if (!subjectsCache || (now - subjectsCache.timestamp > CACHE_DURATION)) {
            console.log(`Fetching subjects data for ${courseCode}`);
            const subjectsData = await fetchSubjects();

            if (!subjectsData) {
                console.warn("Failed to fetch subjects data");
                return null;
            }

            // Save to Chrome storage
            subjectsCache = {
                data: subjectsData.data,
                timestamp: now
            };
            await setChromeStorageData(STORAGE_KEY, subjectsCache);
        } else {
            console.log(`Using cached subjects data (age: ${Math.round((now - subjectsCache.timestamp) / 1000)}s)`);
        }

        const subject = subjectsCache.data[courseCode];

        if (!subject) {
            console.warn(`Subject ${courseCode} not found in subjects data`);
            return null;
        }

        return {
            fullName: subject.fullName,
            folderUrl: subject.folderUrl
        };
    } catch (error) {
        console.error("Error fetching stored subject:", error);
        return null;
    }
}

export async function getFilesFromId(folderId: string | null): Promise<FileObject[] | null> {
    if (!folderId) return null;

    try {
        const now = Date.now();
        const STORAGE_KEY = `files_cache_${folderId}`;

        // Try to load from Chrome storage first
        const cachedData = await getChromeStorageData<{ files: FileObject[], timestamp: number }>(STORAGE_KEY);

        // If we have valid cache (less than 1 hour old), return it
        const FILE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for files
        if (cachedData && (now - cachedData.timestamp < FILE_CACHE_DURATION)) {
            console.log(`Using cached files for folder ${folderId} (age: ${Math.round((now - cachedData.timestamp) / 1000)}s)`);
            return cachedData.files;
        }

        console.log(`Fetching files for folder ID: ${folderId}`);

        // Construct the folder URL from the ID
        const folderUrl = `https://is.mendelu.cz/auth/dok_server/slozka.pl?id=${folderId}`;

        const files = await fetchFilesFromFolder(folderUrl);

        if (!files || files.length === 0) {
            console.log(`No files found for folder ID: ${folderId}`);
            return [];
        }

        // Save to Chrome storage
        await setChromeStorageData(STORAGE_KEY, {
            files,
            timestamp: now
        });

        return files;
    } catch (error) {
        console.error("Error fetching files:", error);
        return null;
    }
}

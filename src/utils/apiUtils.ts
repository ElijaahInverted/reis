import type { FileObject, StoredSubject } from "../types/calendarTypes";
import { fetchSubjects } from "../api/subjects";
import { fetchFilesFromFolder } from "../api/documents";
import { encryptData, decryptData } from "./encryption";
import { StorageService } from "../services/storage";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SUBJECTS_CACHE_KEY = 'reis_subjects_cache';
const FILES_CACHE_PREFIX = 'reis_files_cache_';

interface SubjectsCache {
    data: string; // encrypted
    timestamp: number;
}

interface FilesCache {
    files: string; // encrypted
    timestamp: number;
}

export async function getStoredSubject(courseCode: string): Promise<StoredSubject | null> {
    console.debug('[getStoredSubject] Fetching subject:', courseCode);

    try {
        const now = Date.now();

        // Try to load from storage first (data is now encrypted string)
        let subjectsCache = await StorageService.getAsync<SubjectsCache>(SUBJECTS_CACHE_KEY);

        // Check if cache is valid
        if (!subjectsCache || (now - subjectsCache.timestamp > CACHE_DURATION)) {
            console.debug('[getStoredSubject] Cache miss or expired, fetching fresh data');
            const subjectsData = await fetchSubjects();

            if (!subjectsData) {
                console.debug('[getStoredSubject] No subjects data returned');
                return null;
            }

            // Encrypt data before storing
            const encryptedData = await encryptData(JSON.stringify(subjectsData.data));
            subjectsCache = {
                data: encryptedData,
                timestamp: now
            };
            await StorageService.setAsync(SUBJECTS_CACHE_KEY, subjectsCache);
            console.debug('[getStoredSubject] Cached fresh subjects data');
        }

        try {
            // Decrypt data when reading from cache
            const decryptedData = await decryptData(subjectsCache.data);
            const parsedData = JSON.parse(decryptedData);
            const subject = parsedData[courseCode];

            if (!subject) {
                console.warn(`[getStoredSubject] Subject ${courseCode} not found in subjects data`);
                return null;
            }

            console.debug('[getStoredSubject] Found subject:', courseCode);
            return {
                fullName: subject.fullName,
                folderUrl: subject.folderUrl
            };
        } catch (error) {
            console.warn("[getStoredSubject] Cache corruption detected (decryption/parse failed), clearing cache...", error);
            await StorageService.removeAsync(SUBJECTS_CACHE_KEY);
            return null;
        }
    } catch (error) {
        console.error("[getStoredSubject] Error fetching stored subject:", error);
        return null;
    }
}

export async function getFilesFromId(folderId: string | null): Promise<FileObject[] | null> {
    if (!folderId) return null;

    console.debug('[getFilesFromId] Fetching files for folder:', folderId);

    try {
        const now = Date.now();
        const storageKey = `${FILES_CACHE_PREFIX}${folderId}`;

        // Try to load from storage first (files now encrypted as string)
        const cachedData = await StorageService.getAsync<FilesCache>(storageKey);

        // If we have valid cache (5 minutes for files - fresh during lectures)
        const FILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (was 1 hour)
        if (cachedData && (now - cachedData.timestamp < FILE_CACHE_DURATION)) {
            // Check if data is encrypted (string) or legacy (array)
            if (typeof cachedData.files === 'string') {
                try {
                    // Decrypt cached files
                    const decryptedFiles = await decryptData(cachedData.files);
                    console.debug('[getFilesFromId] Returning cached files');
                    return JSON.parse(decryptedFiles);
                } catch (error) {
                    console.warn("[getFilesFromId] Cache corruption detected (files), clearing cache...", error);
                    await StorageService.removeAsync(storageKey);
                    // Fall through to fetch
                }
            }
        }

        console.debug('[getFilesFromId] Cache miss, fetching from IS');
        // Construct the folder URL from the ID
        const folderUrl = `https://is.mendelu.cz/auth/dok_server/slozka.pl?id=${folderId}`;

        const files = await fetchFilesFromFolder(folderUrl);

        if (!files || files.length === 0) {
            console.debug('[getFilesFromId] No files found');
            return [];
        }

        // Encrypt files before storing
        const encryptedFiles = await encryptData(JSON.stringify(files));
        await StorageService.setAsync(storageKey, {
            files: encryptedFiles,
            timestamp: now
        });

        console.debug('[getFilesFromId] Cached', files.length, 'files');
        return files;
    } catch (error) {
        console.error("[getFilesFromId] Error fetching files:", error);
        return null;
    }
}

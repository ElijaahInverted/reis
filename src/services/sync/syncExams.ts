/**
 * Sync exam data from IS Mendelu to localStorage.
 */

import { StorageService, STORAGE_KEYS } from '../storage';
import { fetchExamData } from '../../api/exams';

export async function syncExams(): Promise<void> {
    console.log('[syncExams] Fetching exam data...');

    const data = await fetchExamData();

    if (data && data.length > 0) {
        StorageService.set(STORAGE_KEYS.EXAMS_DATA, data);
        console.log(`[syncExams] Stored ${data.length} subjects with exams`);
    } else {
        console.log('[syncExams] No exam data to store');
    }
}

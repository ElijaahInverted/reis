/**
 * Sync subject data from IS Mendelu to storage.
 */

import { IndexedDBService } from '../storage';
import { fetchDualLanguageSubjects } from '../../api/subjects';

export async function syncSubjects(studium?: string): Promise<void> {
    console.log('[syncSubjects] Fetching dual-language subject data...');

    const data = await fetchDualLanguageSubjects(studium);

    if (data && Object.keys(data.data).length > 0) {
        await IndexedDBService.set('subjects', 'current', data);
        console.log(`[syncSubjects] Stored ${Object.keys(data.data).length} subjects with dual names`);
    } else {
        console.log('[syncSubjects] No subject data to store');
    }
}

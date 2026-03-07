
/**
 * Sync assessments for all subjects from IS Mendelu to storage.
 */

import { IndexedDBService } from '../storage';
import { fetchAssessments } from '../../api/assessments';
import { getUserParams } from '../../utils/userParams';

export async function syncAssessments(studiumIn?: string): Promise<void> {
    let studium = studiumIn || '';
    let obdobi = '';

    const userParams = await getUserParams();
    if (userParams && userParams.studium && userParams.obdobi) {
        studium = userParams.studium;
        obdobi = userParams.obdobi;
    } else {
        const schedule = await IndexedDBService.get('schedule', 'current');
        if (schedule && schedule.length > 0 && schedule[0].studyId && schedule[0].periodId) {
             studium = schedule[0].studyId;
             obdobi = schedule[0].periodId;
        }
    }

    if (!studium || !obdobi) return;

    const subjectsData = await IndexedDBService.get('subjects', 'current');
    if (!subjectsData || !subjectsData.data) return;

    const subjects = Object.entries(subjectsData.data);

    for (const [courseCode, subject] of subjects) {
        try {
            const predmetId = subject.subjectId;
            if (!predmetId) continue;

            const [czAssessments, enAssessments] = await Promise.all([
                fetchAssessments(studium, obdobi, predmetId, 'cz'),
                fetchAssessments(studium, obdobi, predmetId, 'en')
            ]);

            await IndexedDBService.set('assessments', courseCode, {
                cz: czAssessments,
                en: enAssessments
            });
        } catch (e) {
            console.error(`[syncAssessments] Failed for ${courseCode}:`, e);
        }
    }
}

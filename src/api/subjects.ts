 
 
import { fetchWithAuth, BASE_URL } from "./client";
import type { SubjectInfo, SubjectsData } from "../types/documents";
import { SubjectsDataSchema } from "../schemas/subjectSchema";

const STUDENT_LIST_URL = `${BASE_URL}/auth/student/list.pl`;

export async function fetchSubjects(lang: string = 'cz', studium?: string): Promise<SubjectsData | null> {
    try {
        const isLang = lang;
        const url = studium 
            ? `${STUDENT_LIST_URL}?lang=${isLang};studium=${studium}`
            : `${STUDENT_LIST_URL}?lang=${isLang}`;
            
        const response = await fetchWithAuth(url);
        const html = await response.text();
        const subjectsMap = parseSubjectFolders(html);
        const subjectsData = showFullSubjects(subjectsMap, lang);

        const result = SubjectsDataSchema.safeParse(subjectsData);
        if (result.success) {
            return result.data;
        } else {
            console.error("[fetchSubjects] ❌ Validation failed:", result.error.issues);
            return subjectsData;
        }
    } catch (error) {
        console.error("Failed to fetch subjects:", error);
        return null;
    }
}

/**
 * Fetches subjects in both Czech and English and merges them.
 */
export async function fetchDualLanguageSubjects(studium?: string): Promise<SubjectsData | null> {
    try {
        console.log('[fetchDualLanguageSubjects] Fetching both CZ and EN subject names...');
        
        const czUrl = studium ? `${STUDENT_LIST_URL}?lang=cz;studium=${studium}` : `${STUDENT_LIST_URL}?lang=cz`;
        const enUrl = studium ? `${STUDENT_LIST_URL}?lang=en;studium=${studium}` : `${STUDENT_LIST_URL}?lang=en`;

        // Fetch both in parallel
        const [czRes, enRes] = await Promise.all([
            fetchWithAuth(czUrl),
            fetchWithAuth(enUrl)
        ]);

        const czHtml = await czRes.text();
        const enHtml = await enRes.text();

        const czMap = parseSubjectFolders(czHtml);
        const enMap = parseSubjectFolders(enHtml);

        const merged: Record<string, SubjectInfo> = {};
        
        // Process CZ as base
        for (const [fullName, data] of Object.entries(czMap)) {
            const code = extractSubjectCode(fullName);
            const name = extractCleanName(fullName);
            
            merged[code] = {
                displayName: name,
                fullName,
                nameCs: name,
                subjectCode: code,
                subjectId: data.subjectId,
                folderUrl: data.folderUrl,
                fetchedAt: new Date().toISOString()
            };
        }

        // Merge EN names
        for (const [fullName] of Object.entries(enMap)) {
            const code = extractSubjectCode(fullName);
            if (merged[code]) {
                merged[code].nameEn = extractCleanName(fullName);
            }
        }

        const subjectsData: SubjectsData = {
            version: 1,
            lastUpdated: new Date().toISOString(),
            data: merged
        };

        const result = SubjectsDataSchema.safeParse(subjectsData);
        return result.success ? result.data : subjectsData;
    } catch (error) {
        console.error("[fetchDualLanguageSubjects] Failed:", error);
        return null;
    }
}

interface SubjectLinkData {
    folderUrl: string;
    subjectId?: string;
}

function parseSubjectFolders(htmlString: string): Record<string, SubjectLinkData> {
    const subjectMap: Record<string, SubjectLinkData> = {};
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const table = doc.querySelector('#tmtab_1');
    if (!table) return subjectMap;

    const subjectRows = table.querySelectorAll('tr.uis-hl-table');
    subjectRows.forEach((row) => {
        const subjectLinkElement = row.querySelector('a[href*="/auth/katalog/syllabus.pl"]');
        const folderLinkElement = row.querySelector('a[href*="../dok_server/slozka.pl"]');

        if (subjectLinkElement && folderLinkElement) {
            const subjectName = subjectLinkElement.textContent?.trim() || '';
            const relativeUrl = folderLinkElement.getAttribute('href') || '';
            const cleanUrl = relativeUrl.replace('../', '');
            const absoluteUrl = new URL(cleanUrl, `${BASE_URL}/auth/`).href;
            
            const syllabusHref = subjectLinkElement.getAttribute('href') || '';
            const idMatch = syllabusHref.match(/[?&;]predmet=(\d+)/);
            const subjectId = idMatch ? idMatch[1] : undefined;

            subjectMap[subjectName] = { 
                folderUrl: absoluteUrl,
                subjectId 
            };
        }
    });
    return subjectMap;
}

function extractSubjectCode(subjectName: string): string {
    return subjectName.split(" ")[0];
}

function extractCleanName(fullName: string): string {
    const code = extractSubjectCode(fullName);
    // Remove code at start and trailing info in brackets
    return fullName.replace(code, '').replace(/\s*\([^)]+\)\s*$/, '').trim();
}

function showFullSubjects(subjectsObject: Record<string, SubjectLinkData>, lang: string): SubjectsData {
    const enrichedSubjects: Record<string, SubjectInfo> = {};
    for (const [fullName, data] of Object.entries(subjectsObject)) {
        const subjectCode = extractSubjectCode(fullName);
        const name = extractCleanName(fullName);
        
        enrichedSubjects[subjectCode] = {
            displayName: name,
            fullName,
            nameCs: lang === 'cz' ? name : undefined,
            nameEn: lang === 'en' ? name : undefined,
            subjectCode,
            subjectId: data.subjectId,
            folderUrl: data.folderUrl,
            fetchedAt: new Date().toISOString()
        };
    }
    return {
        version: 1,
        lastUpdated: new Date().toISOString(),
        data: enrichedSubjects
    };
}

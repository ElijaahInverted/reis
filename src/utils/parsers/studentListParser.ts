
import { BASE_URL } from "../../api/client";

export interface ParsedSubjectLinks {
    subjectName: string;
    folderUrl: string;
    links: {
        performance?: string;
        tests?: string;
    }
}

export function parseStudentListLinks(html: string): Record<string, ParsedSubjectLinks> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('#tmtab_1');
    const results: Record<string, ParsedSubjectLinks> = {};

    if (!table) return results;

    const rows = table.querySelectorAll('tr.uis-hl-table');

    rows.forEach(row => {
        // 1. Basic Info & Folder
        const subjectLinkElement = row.querySelector('a[href*="/auth/katalog/syllabus.pl"]');
        const folderLinkElement = row.querySelector('a[href*="../dok_server/slozka.pl"]');

        if (subjectLinkElement && folderLinkElement) {
            const subjectName = subjectLinkElement.textContent?.trim() || '';
            const relativeUrl = folderLinkElement.getAttribute('href') || '';
            const cleanUrl = relativeUrl.replace('../', '');
            const absoluteFolderUrl = new URL(cleanUrl, `${BASE_URL}/auth/`).href;

            // 2. Extra Links
            // Look for "Průběžné hodnocení" (prubezne=1)
            const perfLink = row.querySelector('a[href*="prubezne=1"]');
            const perfUrl = perfLink?.getAttribute('href') || undefined;

            // Look for "Výsledky testů" (test=1) - wait, usually prubezne=1 IS the test results or similar?
            // User requested: "Průběžné hodnocení" ... which in their example HTML was:
            // <a href="/auth/student/list.pl?studium=...;prubezne=1;lang=cz">
            // But user also pointed to `test=1` page.
            // In the first HTML snippet:
            // "Výsledky testů" -> <a href="...test=1..."> which had sysid="etesty-body"
            // "Průběžné hodnocení" -> <a href="...prubezne=1..."> which had sysid="hodnoceni-prubezne"
            
            // We should capture both if available.
            const testLink = row.querySelector('a[href*="test=1"]');
            const testUrl = testLink?.getAttribute('href') || undefined;

            // Resolve absolute URLs
            const resolve = (url?: string) => url ? new URL(url, `${BASE_URL}/auth/student/`).href : undefined;

            results[subjectName] = {
                subjectName,
                folderUrl: absoluteFolderUrl,
                links: {
                    performance: resolve(perfUrl),
                    tests: resolve(testUrl)
                }
            };
        }
    });

    return results;
}

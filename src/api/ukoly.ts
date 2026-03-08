
export interface Assignment {
    courseName: string;
    courseCode: string;
    name: string;
    type: 'individual' | 'group' | 'other';
    deadline: string;
    isActive: boolean;
    fileCount: number;
    actionUrl: string | null;
    infoHtml?: string;
}

export interface UkolyResult {
    assignments: Assignment[];
    lastFetched: number;
}

export async function fetchUkoly(studium: string): Promise<UkolyResult | null> {
    try {
        const url = `https://is.mendelu.cz/auth/student/odevzdavarny.pl?studium=${studium};lang=cz`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch odevzdavarny");

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        const assignments: Assignment[] = [];

        // Table 1: Active assignments (Kam mohu odevzdávat)
        const activeTable = doc.getElementById('tmtab_1');
        if (activeTable) {
            assignments.push(...parseTable(activeTable, true));
        }

        // Table 2: Closed assignments (Kam nemohu odevzdávat)
        const closedTable = doc.getElementById('tmtab_2');
        if (closedTable) {
            assignments.push(...parseTable(closedTable, false));
        }

        return {
            assignments,
            lastFetched: Date.now()
        };
    } catch (error) {
        console.error("Error fetching ukoly:", error);
        return null;
    }
}

function parseTable(table: Element, isActive: boolean): Assignment[] {
    const rows = table.getElementsByTagName('tr');
    const results: Assignment[] = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cols = row.getElementsByTagName('td');
        
        // Skip empty rows (e.g. "Nenalezena žádná vyhovující data")
        if (cols.length < 5) continue;

        // Table 1 (Active): 11 or 12 columns
        // Table 2 (Closed): 12 or 13 columns (one extra column "Otevřená")
        const isClosed = !isActive;
        const hasOrderCol = (isActive && cols.length >= 12) || (isClosed && cols.length >= 13);
        const offset = hasOrderCol ? 1 : 0;

        // Course Name & Code (Index 1)
        const courseCol = cols[offset + 0];
        const courseText = courseCol.textContent?.trim() || "";
        const courseCode = courseText.split(/\s+/)[0] || ""; 
        const courseName = courseText.slice(courseCode.length).trim() || courseText;

        // Task Name (Index 2)
        const name = cols[offset + 1].textContent?.trim() || "";

        // Type (Index 3)
        const typeImg = cols[offset + 2].getElementsByTagName('img')[0];
        const typeSysId = typeImg?.getAttribute('sysid') || "";
        let type: Assignment['type'] = 'other';
        if (typeSysId.includes('individualni')) type = 'individual';
        else if (typeSysId.includes('rozpisova')) type = 'group';

        // Vypsáno pro (Index 4)

        // Deadline (Index 5)
        const deadline = cols[offset + 4].textContent?.trim() || "";

        // Column shift for Closed table starting from "Otevřená" (Index 6 in Closed table)
        const shift = isClosed ? 1 : 0;

        // File Count (Index 7+shift)
        const fileCountIndex = offset + 7 + shift;
        const fileCount = parseInt(cols[fileCountIndex]?.textContent?.trim() || "0", 10) || 0;

        // Instructions (Index 8+shift)
        const pokynyIndex = offset + 8 + shift;
        const pokynyCol = cols[pokynyIndex];
        const instructionsImg = pokynyCol?.getElementsByTagName('img')[0];
        const infoHtml = instructionsImg?.getAttribute('onclick') || undefined;

        // Action URL (Index 10+shift)
        const actionIndex = offset + 10 + shift;
        const actionCol = cols[actionIndex];
        const actionLink = actionCol?.getElementsByTagName('a')[0];
        let actionUrl = actionLink?.getAttribute('href') || null;

        if (actionUrl && !actionUrl.startsWith('http')) {
            actionUrl = `https://is.mendelu.cz/auth/student/${actionUrl}`;
        }

        if (name) {
            results.push({
                courseName,
                courseCode,
                name,
                type,
                deadline,
                isActive,
                fileCount,
                actionUrl,
                infoHtml
            });
        }
    }

    return results;
}

function findHeaderRow(doc: Document, searchTexts: string[]) {
    const boldTags = Array.from(doc.querySelectorAll('td.odsazena b, b, span, strong, h1, h2, h3'));
    for (const tag of boldTags) {
        const text = tag.textContent?.trim() || '';
        if (searchTexts.some(s => text.includes(s))) {
            return tag.closest('tr');
        }
    }
    return null;
}

export function parseRequirementsTable(doc: Document) {
    const row = findHeaderRow(doc, ["Rozložení požadavků na ukončení", "Assessment criteria ratio", "Podíl kritérií na hodnocení"]);
    const table = row?.nextElementSibling?.querySelector("table");
    if (!table) return [];
    return Array.from(table.querySelectorAll("tr")).map(r => Array.from(r.querySelectorAll("th, td")).map(c => (c.textContent || '').trim().replace(/\s+/g, " "))).filter(r => r.length > 0);
}

export function parseAssessmentCriteria(doc: Document) {
    const row = findHeaderRow(doc, ["Assessment criteria ratio:", "Podíl kritérií na hodnocení:", "Rozložení požadavků na ukončení:"]);
    const table = row?.nextElementSibling?.querySelector('table');
    
    if (!table) return [];
    
    const criteria: { requirementType: string; dailyAttendance: string; combinedForm: string }[] = [];
    const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
    
    rows.forEach(r => {
        const cells = Array.from(r.querySelectorAll('td'));
        // Skip header rows (usually they have <th> or are just different)
        // In the IS, the criteria table usually has: Type, Daily, Combined
        if (cells.length >= 3) {
            const type = cells[0].textContent?.trim() || '';
            // Avoid adding header row if it's mistakenly picked up
            if (type && !type.includes('Typ') && !type.includes('Type') && !type.includes('Aktivita')) {
                criteria.push({
                    requirementType: type,
                    dailyAttendance: cells[1].textContent?.trim() || '',
                    combinedForm: cells[2].textContent?.trim() || ''
                });
            }
        }
    });
    
    return criteria;
}

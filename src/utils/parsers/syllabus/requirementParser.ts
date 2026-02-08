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

export function parseRequirementsText(doc: Document) {
    const row = findHeaderRow(doc, ["Požadavky na ukončení", "Requirements for completion", "Assessment methods:", "Metody hodnocení:"]);
    const contentRow = row?.nextElementSibling;
    const cell = contentRow?.querySelector("td");
    
    if (!cell) return 'Error: Section not found';
    
    const clone = cell.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
    return (clone.textContent || '').split('\n').map(l => l.trim().replace(/\s+/g, ' ')).filter(l => l.length > 0).join('\n');
}

export function parseAssessmentMethods(doc: Document) {
    const row = findHeaderRow(doc, ["Assessment methods:", "Metody hodnocení:"]);
    const contentRow = row?.nextElementSibling;
    const cell = contentRow?.querySelector("td");
    
    if (!cell) return null;
    
    const clone = cell.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
    return (clone.textContent || '').split('\n').map(l => l.trim().replace(/\s+/g, ' ')).filter(l => l.length > 0).join('\n').trim();
}

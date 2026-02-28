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

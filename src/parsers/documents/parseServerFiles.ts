/**
 * Parse Server Files
 * 
 * Parses file listings from IS MENDELU document server pages.
 */

import type { ParsedFile } from '../../types/documents';
import { sanitizeString, validateFileName, validateUrl } from '../../utils/validation';
import { parseHtml } from '../domHelpers';
import { extractPaginationLinks, extractFileAttachments } from './parseUtils';

/**
 * Parse server files HTML to extract file information.
 * Handles both folder listings and individual document pages.
 */
export function parseServerFiles(html: string): { files: ParsedFile[], paginationLinks: string[] } {
    console.debug('[parseServerFiles] Starting parse, HTML length:', html.length);
    const doc = parseHtml(html);
    const files: ParsedFile[] = [];
    const paginationLinks: string[] = [];

    // Check if this is a "Read document" page (detail page)
    const detailPageResult = parseDetailPage(doc);
    if (detailPageResult) {
        return detailPageResult;
    }

    // Parse folder listing
    const rows = findDataRows(doc);
    
    // Extract pagination links
    extractPaginationLinks(doc, paginationLinks);

    // Parse each row
    rows.forEach((row) => {
        const parsedFile = parseFileRow(row);
        if (parsedFile) {
            files.push(parsedFile);
        }
    });

    console.debug('[parseServerFiles] Parse complete. Files:', files.length, ', Pagination:', paginationLinks.length);
    return { files, paginationLinks };
}

/**
 * Parse a document detail page (single file view).
 */
function parseDetailPage(doc: Document): { files: ParsedFile[], paginationLinks: string[] } | null {
    const attachmentsLabel = Array.from(doc.querySelectorAll('td'))
        .find(td => td.textContent?.includes('Attachments:') || td.textContent?.includes('Přílohy:'));
    
    if (!attachmentsLabel) return null;

    const row = attachmentsLabel.parentElement;
    const link = row?.querySelector('a')?.getAttribute('href');

    if (!link) return null;

    // Extract metadata from other rows
    const nameRow = Array.from(doc.querySelectorAll('td'))
        .find(td => td.textContent?.includes('Name:') || td.textContent?.includes('Názov:') || td.textContent?.includes('Název:'))
        ?.parentElement;
    const name = nameRow?.querySelectorAll('td')[1]?.textContent?.trim() || 'Unknown';

    const authorRow = Array.from(doc.querySelectorAll('td'))
        .find(td => td.textContent?.includes('Entered by:') || td.textContent?.includes('Vložil:') || td.textContent?.includes('Zadal:'))
        ?.parentElement;
    const author = authorRow?.querySelectorAll('td')[1]?.textContent?.trim() || '';

    const dateRow = Array.from(doc.querySelectorAll('td'))
        .find(td => td.textContent?.includes('Document date:') || td.textContent?.includes('Datum dokumentu:') || td.textContent?.includes('Dátum dokumentu:'))
        ?.parentElement;
    const date = dateRow?.querySelectorAll('td')[1]?.textContent?.trim() || '';

    const commentRow = Array.from(doc.querySelectorAll('td'))
        .find(td => td.textContent?.includes('Comments:') || td.textContent?.includes('Poznámka:') || td.textContent?.includes('Komentář:'))
        ?.parentElement;
    const comment = commentRow?.querySelectorAll('td')[1]?.textContent?.trim() || '';

    const img = row?.querySelector('img[sysid]');
    const type = img?.getAttribute('sysid')?.replace('mime-', '') || 'unknown';

    // Sanitize extracted metadata
    const sanitizedName = validateFileName(name);
    const sanitizedComment = sanitizeString(comment, 500);
    const sanitizedAuthor = sanitizeString(author, 200);
    const validatedUrl = validateUrl(link, 'is.mendelu.cz');

    if (sanitizedName && validatedUrl) {
        return {
            files: [{
                subfolder: '',
                file_name: sanitizedName,
                file_comment: sanitizedComment,
                author: sanitizedAuthor,
                date: date,
                files: [{
                    name: sanitizedName,
                    type: type,
                    link: validatedUrl
                }]
            }],
            paginationLinks: []
        };
    }

    return null;
}

/**
 * Find data rows in the document using multiple selector strategies.
 */
function findDataRows(doc: Document): Element[] {
    // Try multiple selectors to find the table rows
    let rows = doc.querySelectorAll('tr.uis-hl-table.lbn');

    if (rows.length === 0) {
        console.debug('[parseServerFiles] No .uis-hl-table.lbn rows, trying .uis-hl-table');
        rows = doc.querySelectorAll('tr.uis-hl-table');
    }

    if (rows.length === 0) {
        // Fallback: select all rows with at least 5 cells
        const allRows = doc.querySelectorAll('table tr');
        const dataRows: Element[] = [];
        allRows.forEach(r => {
            const cells = r.querySelectorAll('td');
            if (cells.length >= 5) {
                dataRows.push(r);
            }
        });
        console.debug('[parseServerFiles] Found', dataRows.length, 'data rows via fallback');
        return dataRows;
    }

    console.debug('[parseServerFiles] Found', rows.length, 'rows via class selector');
    return Array.from(rows);
}

/**
 * Parse a single file row.
 */
function parseFileRow(row: Element): ParsedFile | null {
    const cells = row.querySelectorAll('td');

    let adder = 0;
    // Check for checkbox/number column
    if (cells[0] && (cells[0].classList.contains("UISTMNumberCell") || cells[0].querySelector('input[type="checkbox"]'))) {
        adder = 1;
    }

    // Check if row has a link
    const hasLink = Array.from(cells).some(c => 
        c.querySelector('a[href*="download"]') || c.querySelector('a[href*="slozka.pl"]')
    );

    // We need at least 2 cells
    if (cells.length < 2) return null;

    // Skip rows without links and with few cells
    if (!hasLink && cells.length < (5 + adder)) return null;

    const subfolder = sanitizeString(cells[adder]?.textContent || '', 100);
    const nameCell = cells[1 + adder];
    let link = nameCell?.querySelector('a');
    const file_name = validateFileName(nameCell?.textContent || '');

    // If the name cell doesn't have a link, look for it in other cells
    if (!link) {
        const allCells = Array.from(cells);
        const downloadLink = allCells.find(c => c.querySelector('a[href*="download"]'))?.querySelector('a');
        if (downloadLink) {
            link = downloadLink;
        } else {
            const otherLink = allCells.find(c => 
                c.querySelector('a[href*="slozka.pl"]') || c.querySelector('a[href*="dokumenty_cteni.pl"]')
            )?.querySelector('a');
            if (otherLink) {
                link = otherLink;
            }
        }
    }

    if (!link || !file_name) return null;

    const file_comment = sanitizeString(cells[2 + adder]?.textContent || '', 500);

    const authorLink = cells[3 + adder]?.querySelector('a');
    const author = sanitizeString(
        authorLink ? authorLink.textContent || '' : cells[3 + adder]?.textContent || '',
        200
    );

    const date = sanitizeString(cells[4 + adder]?.textContent || '', 50);

    // Extract file attachments
    const extractedFiles = extractFileAttachments(cells, link, file_name);

    if (extractedFiles.length > 0) {
        return {
            subfolder,
            file_name,
            file_comment,
            author,
            date,
            files: extractedFiles
        };
    }

    return null;
}

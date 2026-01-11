import type { FileAttachment } from '../../types/documents';
import { sanitizeString, validateFileName, validateUrl } from '../../utils/validation';

/**
 * Extract pagination links from the document.
 */
export function extractPaginationLinks(doc: Document, paginationLinks: string[]): void {
    const allLinks = doc.querySelectorAll('a');
    allLinks.forEach(a => {
        const href = a.getAttribute('href');
        const text = a.textContent?.trim() || '';

        // Check for pagination links (e.g., "11-20", "21-30")
        if (href && href.includes('slozka.pl') && !href.includes('download')) {
            if (text.match(/^\d+-\d+$/)) {
                if (!paginationLinks.includes(href)) {
                    paginationLinks.push(href);
                }
            }
        }
    });
}

/**
 * Check if a link is a navigation link (not a file).
 */
export function isNavigationLink(file_name: string, link: Element): boolean {
    const navTexts = [
        'Všechny moje složky',
        'Nadřazená složka',
        'Zobrazení dokumentů',
        'Strom od složky'
    ];

    const href = link.getAttribute('href') || '';
    
    // Folder links usually contain folder= or refer to directory listing
    if (href.includes('slozka=') || href.includes('vyber_slozku.pl')) return true;
    
    // Explicit folder icons/names
    if (file_name.toLowerCase().includes('slozka') || file_name.toLowerCase().includes('folder')) return true;

    return navTexts.some(text => 
        file_name.includes(text) || link.textContent?.includes(text)
    );
}

/**
 * Extract file attachments from row cells.
 */
export function extractFileAttachments(cells: NodeListOf<Element>, mainLink: Element, file_name: string): FileAttachment[] {
    const filesCell = cells[cells.length - 1];
    const viewCell = cells[cells.length - 2];

    // Collect links from View and Attach cells
    const potentialLinks: Element[] = [];
    if (viewCell) potentialLinks.push(...Array.from(viewCell.querySelectorAll('a')));
    if (filesCell) potentialLinks.push(...Array.from(filesCell.querySelectorAll('a')));

    // Add main link if not already included
    if (mainLink && !potentialLinks.some(pl => pl.getAttribute('href') === mainLink.getAttribute('href'))) {
        potentialLinks.push(mainLink);
    }

    const extractedFiles: FileAttachment[] = [];

    potentialLinks.forEach(link => {
        const img = link.querySelector('img[sysid]');
        let href = link.getAttribute('href') || '';

        // Fix relative paths
        if (!href.startsWith('http') && !href.startsWith('/')) {
            let cleanHref = href;
            if (cleanHref.startsWith('./')) {
                cleanHref = cleanHref.substring(2);
            }
            if (cleanHref.startsWith('slozka.pl') || cleanHref.startsWith('dokumenty_cteni.pl')) {
                href = `/auth/dok_server/${cleanHref}`;
            }
        }

        const validatedUrl = validateUrl(href, 'is.mendelu.cz');
        if (!validatedUrl) return;

        // Filter out navigation links
        if (isNavigationLink(file_name, link)) return;

        if (img) {
            const sysid = img.getAttribute('sysid') || '';
            const type = sysid.startsWith('mime-') ? sysid.replace('mime-', '') : sysid;

            extractedFiles.push({
                name: validateFileName(file_name),
                type: sanitizeString(type, 50),
                link: validatedUrl
            });
        } else if (href && (href.includes('download') || href.includes('.pl'))) {
            extractedFiles.push({
                name: validateFileName(file_name || link.textContent || 'Unknown'),
                type: 'unknown',
                link: validatedUrl
            });
        }
    });

    return extractedFiles;
}

import { fetchWithAuth, BASE_URL } from "./client";
import type { ParsedFile, FileAttachment } from "../types/documents";

import { fetchSubjects } from "./subjects";

export async function fetchDocumentsForSubject(subjectCode: string): Promise<FileAttachment[]> {
    const subjectsData = await fetchSubjects();
    if (!subjectsData) return [];

    const subject = subjectsData.data[subjectCode];
    if (!subject || !subject.folderUrl) return [];

    const parsedFiles = await fetchFilesFromFolder(subject.folderUrl);

    // Flatten the structure to just return all files for now, or we could keep the folder structure
    // The dialog expects FileAttachment[], so let's flatten
    const allFiles: FileAttachment[] = [];
    parsedFiles.forEach(pf => {
        allFiles.push(...pf.files);
    });

    return allFiles;
}

export async function fetchFilesFromFolder(folderUrl: string, recursive: boolean = true): Promise<ParsedFile[]> {
    try {
        const response = await fetchWithAuth(folderUrl);
        const html = await response.text();
        const files = parseServerFiles(html);

        // If recursive mode is enabled, fetch files from subfolders too
        if (recursive) {
            const allFiles: ParsedFile[] = [...files];

            for (const file of files) {
                // Check if this is a folder link (not a downloadable file)
                const isFolder = file.files.some(f =>
                    f.link.includes('slozka.pl') && !f.link.includes('download')
                );

                if (isFolder && file.files.length > 0) {
                    const folderLink = file.files[0].link;
                    // Convert relative link to absolute
                    const absoluteUrl = folderLink.startsWith('http')
                        ? folderLink
                        : `${BASE_URL}/auth/dok_server/${folderLink}`;

                    console.log(`Fetching subfolder: ${file.file_name}`);
                    const subfolderFiles = await fetchFilesFromFolder(absoluteUrl, false); // Don't recurse deeper

                    // Add subfolder info to each file
                    subfolderFiles.forEach(sf => {
                        sf.subfolder = file.file_name;
                    });

                    allFiles.push(...subfolderFiles);
                }
            }

            // Filter out folder entries, keep only actual files
            return allFiles.filter(file =>
                file.files.some(f => f.link.includes('download') || !f.link.includes('slozka.pl'))
            );
        }

        return files;
    } catch (error) {
        console.error("Failed to fetch files:", error);
        return [];
    }
}


export function parseServerFiles(html: string): ParsedFile[] {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Check if this is a "Read document" page (detail page)
    const attachmentsLabel = Array.from(doc.querySelectorAll('td')).find(td => td.textContent?.includes('Attachments:') || td.textContent?.includes('Přílohy:'));
    if (attachmentsLabel) {
        console.log("Detected 'Read document' detail page");
        const row = attachmentsLabel.parentElement;
        const link = row?.querySelector('a')?.getAttribute('href');

        if (link) {
            // Extract metadata from other rows
            const nameRow = Array.from(doc.querySelectorAll('td')).find(td => td.textContent?.includes('Name:') || td.textContent?.includes('Názov:') || td.textContent?.includes('Název:'))?.parentElement;
            const name = nameRow?.querySelectorAll('td')[1]?.textContent?.trim() || 'Unknown';

            const authorRow = Array.from(doc.querySelectorAll('td')).find(td => td.textContent?.includes('Entered by:') || td.textContent?.includes('Vložil:') || td.textContent?.includes('Zadal:'))?.parentElement;
            const author = authorRow?.querySelectorAll('td')[1]?.textContent?.trim() || '';

            const dateRow = Array.from(doc.querySelectorAll('td')).find(td => td.textContent?.includes('Document date:') || td.textContent?.includes('Datum dokumentu:') || td.textContent?.includes('Dátum dokumentu:'))?.parentElement;
            const date = dateRow?.querySelectorAll('td')[1]?.textContent?.trim() || '';

            const commentRow = Array.from(doc.querySelectorAll('td')).find(td => td.textContent?.includes('Comments:') || td.textContent?.includes('Poznámka:') || td.textContent?.includes('Komentář:'))?.parentElement;
            const comment = commentRow?.querySelectorAll('td')[1]?.textContent?.trim() || '';

            const img = row?.querySelector('img[sysid]');
            const type = img?.getAttribute('sysid')?.replace('mime-', '') || 'unknown';

            return [{
                subfolder: '',
                file_name: name,
                file_comment: comment,
                author: author,
                date: date,
                files: [{
                    name: name,
                    type: type,
                    link: link
                }]
            }];
        }
    }

    // Try multiple selectors to find the table rows
    let rows = doc.querySelectorAll('tr.uis-hl-table.lbn');
    console.log(`Found ${rows.length} rows with 'tr.uis-hl-table.lbn'`);

    // If no rows found, try less strict selector
    if (rows.length === 0) {
        rows = doc.querySelectorAll('tr.uis-hl-table');
        console.log(`Found ${rows.length} rows with 'tr.uis-hl-table'`);
    }

    // If still no rows, try even more general
    if (rows.length === 0) {
        rows = doc.querySelectorAll('table tr');
        console.log(`Found ${rows.length} rows with 'table tr'`);
    }

    const files: ParsedFile[] = [];

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');

        // Skip rows with too few cells
        if (cells.length < 6) {
            // console.log(`Row ${index}: Skipped (too few cells: ${cells.length})`);
            return;
        }

        let adder = 0;
        if (cells[0] && cells[0].classList.contains("UISTMNumberCell")) {
            adder = 1;
        }

        // More lenient check
        if (cells.length < (6 + adder)) {
            // console.log(`Row ${index}: Skipped (too few cells with adder: ${cells.length}, adder: ${adder})`);
            return;
        }

        const subfolder = cells[(adder)]?.textContent?.trim() || '';
        const file_name = cells[(1 + adder)]?.textContent?.trim() || '';
        const file_comment = cells[(2 + adder)]?.textContent?.trim() || '';

        const authorLink = cells[(3 + adder)]?.querySelector('a');
        const author = authorLink ? authorLink.textContent?.trim() || '' : cells[(3 + adder)]?.textContent?.trim() || '';

        const date = cells[(4 + adder)]?.textContent?.trim() || '';

        // Look for file links - try multiple cell indices
        let filesCell = cells[(6 + adder)];
        if (!filesCell) {
            filesCell = cells[(5 + adder)]; // Try one cell earlier
        }

        if (!filesCell) {
            // console.log(`Row ${index}: Skipped (no files cell found)`);
            return;
        }

        const fileLinks = filesCell.querySelectorAll('a');
        // console.log(`Row ${index}: Found ${fileLinks.length} file links in cell. Cell content: ${filesCell.innerHTML.substring(0, 50)}...`);

        const extractedFiles: FileAttachment[] = [];
        fileLinks.forEach(link => {
            const img = link.querySelector('img[sysid]');
            if (img) {
                const sysid = img.getAttribute('sysid') || '';
                const type = sysid.startsWith('mime-') ? sysid.replace('mime-', '') : sysid;

                extractedFiles.push({
                    name: file_name,
                    type: type,
                    link: link.getAttribute('href') || ''
                });
            } else {
                // Try without img - maybe the link is directly the file
                const href = link.getAttribute('href');
                if (href && (href.includes('download') || href.includes('.pl'))) {
                    extractedFiles.push({
                        name: file_name || link.textContent?.trim() || 'Unknown',
                        type: 'unknown',
                        link: href
                    });
                }
            }
        });

        if (extractedFiles.length > 0) {
            console.log(`Extracted ${extractedFiles.length} files from row ${index}`);
            files.push({
                subfolder,
                file_name,
                file_comment,
                author,
                date,
                files: extractedFiles
            });
        }
    });

    console.log(`Total files parsed: ${files.length}`);
    return files;
}

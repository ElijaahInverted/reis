/**
 * useFileDownload - Hook for downloading files with retry logic and ZIP support.
 * 
 * Handles:
 * - Single file downloads with retry on 404
 * - Bulk ZIP downloads
 * - URL resolution for IS Mendelu document server
 * - Progress tracking
 */

import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface FileInfo {
    url: string;
    name: string;
    subfolder?: string;
}

interface UseFileDownloadOptions {
    /** Function to refresh file URLs when stale (404) */
    onRefreshUrls?: () => Promise<FileInfo[] | null>;
    /** Callback when download starts */
    onDownloadStart?: () => void;
    /** Callback when download completes */
    onDownloadComplete?: () => void;
    /** Callback on download error */
    onError?: (error: Error) => void;
}

interface UseFileDownloadReturn {
    /** Whether currently downloading */
    isDownloading: boolean;
    /** Whether loading a single file */
    isLoadingFile: boolean;
    /** Download a single file (open in browser or trigger download) */
    downloadFile: (url: string, retryCount?: number) => Promise<void>;
    /** Download multiple files as ZIP */
    downloadAsZip: (files: FileInfo[], zipName: string) => Promise<void>;
}

/**
 * Resolve IS Mendelu document URLs to direct download links.
 * Handles intermediate pages and path corrections.
 */
async function resolveFinalFileUrl(link: string): Promise<string> {
    // Clean up the link - IS Mendelu uses semicolons in URLs which causes 404s
    link = link.replace(/\?;/g, '?').replace(/;/g, '&');

    // Check if it's a "dokumenty_cteni.pl" link (view link)
    if (link.includes('dokumenty_cteni.pl')) {
        try {
            const normalizedLink = link.replace(/;/g, '&').replace(/\?/g, '&');
            const idMatch = normalizedLink.match(/[&]id=(\d+)/);
            const dokMatch = normalizedLink.match(/[&]dok=(\d+)/);

            if (idMatch && dokMatch) {
                const id = idMatch[1];
                const dok = dokMatch[1];
                return `https://is.mendelu.cz/auth/dok_server/slozka.pl?download=${dok}&id=${id}&z=1`;
            }
        } catch (e) {
            console.warn('Failed to construct direct download URL:', e);
        }
    }

    // Construct the full URL
    let fullUrl = '';
    if (link.startsWith('http')) {
        fullUrl = link;
    } else {
        if (link.startsWith('/')) {
            fullUrl = `https://is.mendelu.cz${link}`;
        } else {
            fullUrl = `https://is.mendelu.cz/auth/dok_server/${link}`;
        }
    }

    // Check if we need to find the download link
    if (!fullUrl.includes('download=')) {
        try {
            const pageResponse = await fetch(fullUrl, { credentials: 'include' });
            const pageText = await pageResponse.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(pageText, 'text/html');

            const downloadLink = Array.from(doc.querySelectorAll('a')).find(a =>
                a.href.includes('download=') && a.querySelector('img[sysid]')
            );

            if (downloadLink) {
                let newLink = downloadLink.getAttribute('href');
                if (newLink) {
                    if (!newLink.startsWith('http')) {
                        if (newLink.startsWith('/')) {
                            fullUrl = newLink.includes('dokumenty_cteni.pl')
                                ? `https://is.mendelu.cz/auth/dok_server${newLink}`
                                : `https://is.mendelu.cz${newLink}`;
                        } else {
                            fullUrl = `https://is.mendelu.cz/auth/dok_server/${newLink}`;
                        }
                    } else {
                        fullUrl = newLink;
                        if (fullUrl.includes('dokumenty_cteni.pl') && !fullUrl.includes('/auth/')) {
                            fullUrl = fullUrl.replace('is.mendelu.cz/dokumenty_cteni.pl', 'is.mendelu.cz/auth/dok_server/dokumenty_cteni.pl');
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to parse intermediate page:', e);
        }
    }

    return fullUrl;
}

export function useFileDownload(options: UseFileDownloadOptions = {}): UseFileDownloadReturn {
    const { onRefreshUrls, onDownloadStart, onDownloadComplete, onError } = options;

    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoadingFile, setIsLoadingFile] = useState(false);

    const downloadFile = useCallback(async (url: string, retryCount = 0) => {
        setIsLoadingFile(true);
        onDownloadStart?.();

        try {
            const fullUrl = await resolveFinalFileUrl(url);

            const response = await fetch(fullUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/pdf,application/octet-stream,*/*'
                }
            });

            // Handle 404 with retry
            if (response.status === 404) {
                if (retryCount === 0 && onRefreshUrls) {
                    const freshFiles = await onRefreshUrls();
                    if (freshFiles && freshFiles.length > 0) {
                        const originalFileName = url.split('/').pop()?.split('?')[0];
                        const refreshedFile = freshFiles.find(f =>
                            f.url.includes(originalFileName || '') || f.name === originalFileName
                        );
                        if (refreshedFile) {
                            await downloadFile(refreshedFile.url, 1);
                            return;
                        }
                    }
                }
                console.warn('[useFileDownload] 404 - falling back to window.open');
                window.open(fullUrl, '_blank');
                setIsLoadingFile(false);
                return;
            }

            if (!response.ok) {
                console.warn(`[useFileDownload] HTTP error ${response.status}`);
                window.open(fullUrl, '_blank');
                setIsLoadingFile(false);
                return;
            }

            const contentType = response.headers.get('content-type');

            // Safety check for HTML responses
            if (contentType?.includes('text/html')) {
                console.warn('Received HTML instead of file');
                window.open(fullUrl, '_blank');
                setIsLoadingFile(false);
                return;
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            if (contentType?.includes('application/pdf')) {
                window.open(blobUrl, '_blank');
            } else {
                const a = document.createElement('a');
                a.href = blobUrl;

                // Extract filename from headers
                const contentDisposition = response.headers.get('content-disposition');
                let filename = 'download';
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (match?.[1]) {
                        filename = match[1];
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            onDownloadComplete?.();
        } catch (error) {
            console.error('Error loading file:', error);
            onError?.(error as Error);
        } finally {
            setIsLoadingFile(false);
        }
    }, [onRefreshUrls, onDownloadStart, onDownloadComplete, onError]);

    const downloadAsZip = useCallback(async (files: FileInfo[], zipName: string) => {
        if (files.length === 0) return;

        setIsDownloading(true);
        onDownloadStart?.();

        const zip = new JSZip();

        try {
            const downloadPromises = files.map(async (file) => {
                try {
                    const fullUrl = await resolveFinalFileUrl(file.url);
                    const response = await fetch(fullUrl, { credentials: 'include' });

                    if (!response.ok) return;

                    const blob = await response.blob();

                    // Get filename from headers or use provided name
                    const contentDisposition = response.headers.get('content-disposition');
                    let finalName = file.name;
                    if (contentDisposition) {
                        const match = contentDisposition.match(/filename="?([^"]+)"?/);
                        if (match?.[1]) finalName = match[1];
                    }

                    // Prefix with subfolder to avoid collisions
                    if (file.subfolder) {
                        const cleanSub = file.subfolder.replace(/^\/|\/$/g, '').replace(/\//g, '_');
                        finalName = `${cleanSub}_${finalName}`;
                    }

                    zip.file(finalName, blob);
                } catch (error) {
                    console.warn(`Failed to download ${file.name}:`, error);
                }
            });

            await Promise.all(downloadPromises);

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${zipName}.zip`);

            onDownloadComplete?.();
        } catch (error) {
            console.error('Error creating ZIP:', error);
            onError?.(error as Error);
        } finally {
            setIsDownloading(false);
        }
    }, [onDownloadStart, onDownloadComplete, onError]);

    return {
        isDownloading,
        isLoadingFile,
        downloadFile,
        downloadAsZip,
    };
}

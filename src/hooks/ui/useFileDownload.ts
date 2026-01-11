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
import { resolveFinalFileUrl } from '../../utils/fileUrlResolver';
import { loggers } from '../../utils/logger';

export interface FileInfo {
    url: string;
    name: string;
    subfolder?: string;
}

export interface UseFileDownloadOptions {
    /** Function to refresh file URLs when stale (404) */
    onRefreshUrls?: () => Promise<FileInfo[] | null>;
    /** Callback when download starts */
    onDownloadStart?: () => void;
    /** Callback when download completes */
    onDownloadComplete?: () => void;
    /** Callback on download error */
    onError?: (error: Error) => void;
}

export interface UseFileDownloadReturn {
    /** Whether currently downloading */
    isDownloading: boolean;
    /** Whether loading a single file */
    isLoadingFile: boolean;
    /** Download a single file (open in browser or trigger download) */
    downloadFile: (url: string, retryCount?: number) => Promise<void>;
    /** Download multiple files as ZIP */
    downloadAsZip: (files: FileInfo[], zipName: string) => Promise<void>;
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
                loggers.ui.warn('[useFileDownload] 404 - falling back to window.open');
                window.open(fullUrl, '_blank');
                setIsLoadingFile(false);
                return;
            }

            if (!response.ok) {
                loggers.ui.warn('[useFileDownload] HTTP error:', response.status);
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
            loggers.ui.error('[useFileDownload] Error loading file:', error);
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
                    loggers.ui.warn('[useFileDownload] Failed to download file:', file.name, error);
                }
            });

            await Promise.all(downloadPromises);

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${zipName}.zip`);

            onDownloadComplete?.();
        } catch (error) {
            loggers.ui.error('[useFileDownload] Error creating ZIP:', error);
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

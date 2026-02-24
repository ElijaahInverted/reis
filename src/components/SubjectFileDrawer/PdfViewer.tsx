import { useState, useCallback, lazy, Suspense } from 'react';
import { Loader2, ZoomIn, ZoomOut, X } from 'lucide-react';

const LazyDocument = lazy(() =>
    Promise.all([
        import('react-pdf'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([mod, workerMod]) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
        return { default: mod.Document };
    })
);

const LazyPage = lazy(() => import('react-pdf').then(mod => ({ default: mod.Page })));

interface PdfViewerProps {
    blobUrl: string;
    onClose: () => void;
}

export function PdfViewer({ blobUrl, onClose }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState(1.0);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-2 border-b border-base-300 bg-base-200/50 shrink-0">
                <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-xs btn-square" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}>
                        <ZoomOut size={14} />
                    </button>
                    <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button className="btn btn-ghost btn-xs btn-square" onClick={() => setScale(s => Math.min(3, s + 0.25))}>
                        <ZoomIn size={14} />
                    </button>
                </div>
                <span className="text-xs text-base-content/50">{numPages > 0 && `${numPages} pages`}</span>
                <button className="btn btn-ghost btn-xs btn-square" onClick={onClose}>
                    <X size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-auto bg-base-300/30 p-4">
                <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={24} /></div>}>
                    <LazyDocument file={blobUrl} onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={24} /></div>}>
                        {Array.from({ length: numPages }, (_, i) => (
                            <LazyPage key={i} pageNumber={i + 1} scale={scale}
                                className="mb-4 shadow-lg mx-auto"
                                renderTextLayer={false} renderAnnotationLayer={false} />
                        ))}
                    </LazyDocument>
                </Suspense>
            </div>
        </div>
    );
}

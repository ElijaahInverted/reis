import { X, File, FileType, Map } from 'lucide-react';
import { GetIdFromLink } from "../utils/calendarUtils";
import { getFilesFromId, getStoredSubject } from "../utils/apiUtils";
import type { FileObject, StoredSubject, BlockLesson } from "../types/calendarTypes";
import { useEffect, useState } from "react";

export interface SubjectPopupPropsV2 {
    code: BlockLesson,
    onClose: () => void,
}

export function RenderSubFiles(props: { status: number | null }) {
    switch (props.status) {
        case null:
            return (
                <div className="w-full h-80 xl:h-150 flex justify-center items-center">
                    <span className="text-base xl:text-xl font-dm font-semibold text-gray-700">Chyba při načítání souborů</span>
                </div>
            )
        case 0:
        case 1:
        case 2:
            return (
                <div className="w-full h-80 xl:h-150 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8DC843]"></div>
                </div>
            )
    }
}

export function RenderEmptySubject(props: { code: string, setter: () => void }) {
    return (
        <div className="p-1 pl-4 pr-4 relative h-full w-100 xl:w-180 rounded-xl bg-gray-50 shadow-xl flex flex-col items-center justify-center font-dm">
            <span className="absolute right-2 top-2 w-6 h-6 xl:w-8 xl:h-8 flex justify-center items-center text-gray-500 cursor-pointer hover:scale-90 transition-all" onClick={() => { props.setter() }}>
                <X size={"2rem"}></X>
            </span>
            <span className="w-full h-8 xl:h-16 text-gray-800 flex flex-col justify-center items-center font-dm text-base xl:text-2xl">{`Předmět ${props.code} nenalezen v lokálním uložišti`}</span>
        </div>
    )
}

export function SubjectPopup(props: SubjectPopupPropsV2) {
    //FETCH SUBJECT FROM STORAGE
    const [subject_data, setSubjectData] = useState<StoredSubject | null>(null);
    const [files, setFiles] = useState<FileObject[] | null>(null);
    const [loadingfile, setLoadingFile] = useState<boolean>(false);
    const [loadingSubject, setLoadingSubject] = useState<boolean>(true); // NEW: Track subject loading
    const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
    const [subfolderFilter, setSubfolderFilter] = useState<string>("all");
    //
    function parseName(name: string, hasComment: boolean = false) {
        const MAX_LENGTH = hasComment ? 40 : 100; // kratší pro položky s komentářem, delší bez komentáře

        if (name.length > MAX_LENGTH) {
            const name_deducted = name.substring(0, MAX_LENGTH - 3);
            return name_deducted + "...";
        }
        return name;
    }
    //
    useEffect(() => {
        (async () => {
            try {
                setLoadingSubject(true);
                setLoadingFiles(true);

                const STORED_SUBJECT = await getStoredSubject(props.code.courseCode);
                setSubjectData(STORED_SUBJECT);
                setLoadingSubject(false); // Subject fetch complete

                if (STORED_SUBJECT == null) {
                    setFiles([]);
                    setLoadingFiles(false);
                    return;
                }

                // Try to load cached files first
                const cachedKey = `files_${props.code.courseCode}`;
                const cachedFiles = localStorage.getItem(cachedKey);
                if (cachedFiles) {
                    try {
                        setFiles(JSON.parse(cachedFiles));
                    } catch (e) {
                        console.error("Failed to parse cached files", e);
                    }
                }

                // Fetch fresh files in background
                console.log(GetIdFromLink(STORED_SUBJECT.folderUrl), STORED_SUBJECT.folderUrl);
                const files = await getFilesFromId(GetIdFromLink(STORED_SUBJECT.folderUrl));
                setFiles(files);
                setLoadingFiles(false);

                // Cache for next time
                if (files && files.length > 0) {
                    localStorage.setItem(cachedKey, JSON.stringify(files));
                }
            } catch (error) {
                console.error("Error loading popup data:", error);
                setLoadingSubject(false);
                setLoadingFiles(false);
            }
        })();
    }, [])
    //
    // Add ESC key listener to close popup
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                props.onClose();
            }
        };

        window.addEventListener('keydown', handleEscKey);

        // Cleanup listener when component unmounts
        return () => {
            window.removeEventListener('keydown', handleEscKey);
        };
    }, [props.onClose])
    //
    async function loadFile(link: string) {
        setLoadingFile(true);
        try {
            // Construct the full URL
            let fullUrl = '';
            if (link.startsWith('http')) {
                fullUrl = link;
            } else {
                fullUrl = `https://is.mendelu.cz/auth/dok_server/${link}`;
            }

            console.log('Initial link:', fullUrl);

            // Step 1: Check if we need to find the download link (if it's an intermediate page)
            if (!fullUrl.includes('download=')) {
                console.log('Intermediate page detected, fetching to find download link...');
                const pageResponse = await fetch(fullUrl, { credentials: 'include' });
                const pageText = await pageResponse.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(pageText, 'text/html');

                // Look for the download link: <a> containing <img sysid> and href with 'download='
                // The user provided example: <a href="...download=..."><img ... sysid="mime-pdf"></a>
                const downloadLink = Array.from(doc.querySelectorAll('a')).find(a =>
                    a.href.includes('download=') && a.querySelector('img[sysid]')
                );

                if (downloadLink) {
                    let newLink = downloadLink.getAttribute('href');
                    if (newLink) {
                        // Handle relative paths
                        if (!newLink.startsWith('http')) {
                            // It's usually relative to /auth/dok_server/
                            if (newLink.startsWith('/')) {
                                fullUrl = `https://is.mendelu.cz${newLink}`;
                            } else {
                                fullUrl = `https://is.mendelu.cz/auth/dok_server/${newLink}`;
                            }
                        } else {
                            fullUrl = newLink;
                        }
                        console.log('Found direct download link:', fullUrl);
                    }
                } else {
                    console.warn('Could not find direct download link on page. Using original.');
                }
            }

            // Step 2: Fetch the actual file
            console.log('Fetching file content:', fullUrl);
            const response = await fetch(fullUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/pdf,application/octet-stream,*/*'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            // Safety check: if we still got HTML, something is wrong (or it's not a file)
            if (contentType?.includes('text/html')) {
                console.warn('Received HTML. Opening in new tab.');
                window.open(fullUrl, '_blank');
                setLoadingFile(false);
                return;
            }

            // Step 3: Handle Blob
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            if (contentType?.includes('application/pdf')) {
                // Open PDF in new tab
                window.open(blobUrl, '_blank');
            } else {
                // Download other files
                const a = document.createElement('a');
                a.href = blobUrl;

                // Try to get filename
                const contentDisposition = response.headers.get('content-disposition');
                let filename = 'download';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1];
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            // Cleanup
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 1000);

            setLoadingFile(false);
        } catch (error) {
            console.error('Error loading file:', error);
            setLoadingFile(false);
            alert('Nepodařilo se otevřít soubor. Zkuste to prosím znovu.');
        }
    };
    //
    function groupFilesByFolder(files: FileObject[]) {
        const grouped: { [folderId: string]: FileObject[] } = {};

        // Filter files by subfolder if a filter is active
        const filteredFiles = subfolderFilter === "all"
            ? files
            : files.filter(file => file.subfolder === subfolderFilter);

        filteredFiles.forEach(file => {
            const link = file.files[0]?.link || '';
            const match = link.match(/id=(\d+)/);
            const folderId = match ? match[1] : 'unknown';

            if (!grouped[folderId]) {
                grouped[folderId] = [];
            }
            grouped[folderId].push(file);
        });

        const sortedFolderIds = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

        // Flatten and sort files within each folder by comment number
        const sortedFiles: FileObject[] = [];
        sortedFolderIds.forEach(folderId => {
            const folderFiles = grouped[folderId].sort((a, b) => {
                // Extract numbers from file_comment (e.g., "Přednáška 3" -> 3)
                const numA = parseInt(a.file_comment.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.file_comment.match(/\d+/)?.[0] || '0');
                return numA - numB;
            });
            sortedFiles.push(...folderFiles);
        });

        return sortedFiles;
    }

    // Get unique subfolders for filter dropdown
    function getUniqueSubfolders(files: FileObject[]): string[] {
        const subfolders = new Set<string>();
        files.forEach(file => {
            if (file.subfolder && file.subfolder.trim() !== '') {
                subfolders.add(file.subfolder);
            }
        });
        return Array.from(subfolders).sort();
    }

    // Extract display name from subfolder (part after "/")
    function getSubfolderDisplayName(subfolder: string): string {
        const parts = subfolder.split('/');
        return parts.length > 1 ? parts[1].trim() : subfolder;
    }
    //
    // Handle click outside popup to close
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only close if clicking on the backdrop itself, not on child elements
        if (e.target === e.currentTarget) {
            props.onClose();
        }
    };
    //
    // Show loading state while fetching subject
    if (loadingSubject) {
        return (
            <div className="fixed z-[999] top-0 left-0 w-screen h-screen flex justify-center items-center bg-black/50 backdrop-grayscale font-dm p-8" onClick={handleBackdropClick}>
                <div className="p-8 relative h-fit w-100 xl:w-180 rounded-xl bg-white shadow-xl flex flex-col items-center justify-center font-dm">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8DC843] mb-4"></div>
                    <span className="text-base xl:text-lg text-gray-600">Načítání předmětu...</span>
                </div>
            </div>
        );
    }

    // Show empty state if no subject data (ONLY after loading is complete)
    if (subject_data === null && !loadingSubject) {
        return (
            <div className="fixed z-[999] top-0 left-0 w-screen h-screen flex justify-center items-center bg-black/50 backdrop-grayscale font-dm p-8" onClick={handleBackdropClick}>
                <div className="p-4 relative h-fit w-100 xl:w-180 rounded-xl bg-gray-50 shadow-xl flex flex-col items-center justify-center font-dm">
                    <span className="absolute right-2 top-2 w-6 h-6 xl:w-8 xl:h-8 flex justify-center items-center text-gray-500 cursor-pointer hover:scale-90 transition-all" onClick={props.onClose}>
                        <X size={"2rem"}></X>
                    </span>
                    <span className="text-base xl:text-xl text-gray-700 py-8">{`Předmět ${props.code.courseCode} nenalezen`}</span>
                </div>
            </div>
        );
    }
    //
    return (
        <div className="fixed z-[999] top-0 left-0 w-screen h-screen flex justify-center items-center bg-black/50 backdrop-grayscale font-dm p-8" onClick={handleBackdropClick}>
            {/*Window*/}
            {subject_data ?
                <div className="p-1 pl-4 pr-4 relative h-full w-100 xl:w-180 rounded-xl bg-gray-50 shadow-xl flex flex-col items-center font-dm bg-white">
                    <span className="absolute right-2 top-2 w-6 h-6 xl:w-8 xl:h-8 flex justify-center items-center text-gray-500 cursor-pointer hover:scale-90 transition-all" onClick={() => { props.onClose() }}>
                        <X size={"2rem"}></X>
                    </span>
                    <span className="w-full h-8 xl:h-16 text-gray-800 flex flex-col justify-center items-center font-dm text-base xl:text-2xl">{subject_data.fullName}</span>
                    <span className="w-full h-0.25 bg-gray-200 mb-2"></span>
                    <div className="text-base text-gray-700 w-full flex flex-col mt-4">
                        <span className="text-base xl:text-xl text-gray-700 font-medium">Vyučující události</span>
                        <a
                            href={`https://is.mendelu.cz/auth/lide/clovek.pl?id=${props.code.teachers[0].id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base xl:text-lg text-gray-700 hover:underline"
                        >
                            {props.code.teachers[0].shortName}
                        </a>
                    </div>
                    <div className="text-base text-gray-700 w-full flex flex-col mt-4">
                        <span className="text-base xl:text-xl text-gray-700 font-medium mb-1">Místnost</span>
                        <span className="w-fit relative text-base xl:text-lg text-gray-700 flex items-center gap-2">
                            {props.code.room}
                            {/* Only rooms are 'Q' are currently supported in the widget with simple config */}
                            {props.code.room.startsWith('Q') && (
                                <Map
                                    className="h-5 w-5 text-primary cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => { window.open(`https://mm.mendelu.cz/mapwidget/embed?placeName=${props.code.room}`, "_blank") }}
                                />
                            )}
                        </span>
                    </div>
                    <div className="text-base text-gray-700 w-full flex flex-col mt-4 h-3/5">
                        <div className="flex flex-row justify-between items-center min-h-fit">
                            <span className="text-base xl:text-xl text-gray-700 font-medium">Dostupné soubory</span>
                            {typeof files !== "number" && files !== null && files.length > 0 && getUniqueSubfolders(files).length > 1 && (
                                <select
                                    value={subfolderFilter}
                                    onChange={(e) => setSubfolderFilter(e.target.value)}
                                    className="text-gray-900 text-sm px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
                                >
                                    <option value="all">Vše</option>
                                    {getUniqueSubfolders(files).map((subfolder) => (
                                        <option key={subfolder} value={subfolder}>
                                            {getSubfolderDisplayName(subfolder)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className='w-full flex flex-1 flex-col overflow-y-auto'>
                            {loadingFiles && (!files || files.length === 0) ? (
                                <div className="w-full h-32 flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8DC843]"></div>
                                </div>
                            ) : files === null || files.length === 0 ? (
                                <div className="w-full h-32 flex justify-center items-center">
                                    <span className="text-sm text-gray-500">Žádné soubory nejsou dostupné</span>
                                </div>
                            ) : loadingfile ? (
                                <div className="w-full h-32 flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8DC843]"></div>
                                    <span className="ml-3 text-sm text-gray-500">Otevírání souboru...</span>
                                </div>
                            ) : (
                                groupFilesByFolder(files).map((data, i) =>
                                    data.files.map((_, l) => (
                                        <div key={`${i}-${l}`} className="relative w-full min-h-10 flex flex-row items-center text-xs xl:text-base gap-2">
                                            <div className="aspect-square flex-none flex justify-center items-center">
                                                <File />
                                            </div>
                                            <span
                                                className={`text-gray-700 pl-2 pr-2 hover:text-primary cursor-pointer ${data.file_comment ? 'w-80' : 'w-full'}`}
                                                onClick={() => loadFile(_.link)}
                                            >
                                                {data.files.length === 1 ?
                                                    parseName(data.file_name, !!data.file_comment) :
                                                    parseName(data.file_name + ": část " + (l + 1), !!data.file_comment)}
                                            </span>
                                            {data.file_comment && (
                                                <>
                                                    <div className="aspect-square h-full flex justify-center items-center">
                                                        <FileType />
                                                    </div>
                                                    <span className="text-gray-400 ml-2">{data.file_comment}</span>
                                                </>
                                            )}
                                            {/* <span className="text-gray-400 ml-2">{data.author}</span> */}
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                </div> :
                <RenderEmptySubject code={props.code.courseCode} setter={props.onClose} />
            }
        </div>
    )
}

/**
 * SubjectFileDrawer Types
 * 
 * Shared types for SubjectFileDrawer subcomponents.
 */

import type { BlockLesson } from '../../types/calendarTypes';
import type { ParsedFile, CourseMetadata } from '../../types/documents';

export interface DrawerHeaderProps {
    lesson: BlockLesson | null;
    courseId: string;
    courseInfo?: CourseMetadata; // New: metadata for search/sidebar view
    selectedCount: number;
    isDownloading: boolean;
    activeTab: 'files' | 'stats' | 'assessments' | 'syllabus';
    onClose: () => void;
    onDownload: () => void;
    onTabChange: (tab: 'files' | 'stats' | 'assessments' | 'syllabus') => void;
}

export interface FileGroup {
    name: string;
    displayName: string;
    files: ParsedFile[];
}

export interface FileListProps {
    groups: FileGroup[];
    selectedIds: string[];
    fileRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
    ignoreClickRef: React.MutableRefObject<boolean>;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onOpenFile: (link: string) => void;
}

export interface DragSelectionState {
    isDragging: boolean;
    selectionStart: { x: number; y: number } | null;
    selectionEnd: { x: number; y: number } | null;
    selectedIds: string[];
}

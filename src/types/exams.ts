/**
 * Exam-related type definitions.
 * 
 * Extracted from ExamDrawer for shared usage across:
 * - ExamPanel
 * - ExamTimeline
 * - useExams hook
 * - DatePickerPopup
 */

export interface ExamTerm {
    id: string;
    date: string;         // Format: "DD.MM.YYYY"
    time: string;         // Format: "HH:MM"
    capacity?: string;    // e.g., "18/20"
    full?: boolean;
    room?: string;
    teacher?: string;
    registrationStart?: string;  // When registration opens
}

export interface ExamSection {
    id: string;
    name: string;         // Section name (e.g., "zkouška")
    type: string;         // Exam type
    status: 'registered' | 'available' | 'open';  // open = not yet registered for
    registeredTerm?: {
        id?: string;
        date: string;
        time: string;
        room?: string;
        teacher?: string;
    };
    terms: ExamTerm[];
}

export interface ExamSubject {
    id: string;
    name: string;         // Full subject name
    code: string;         // e.g., "EBC-ALG"
    sections: ExamSection[];
}

/**
 * Registered exam for timeline display.
 * Simplified structure with only essential info.
 */
export interface RegisteredExam {
    code: string;
    name: string;
    sectionName: string;
    date: string;
    time: string;
    room?: string;
}

/**
 * Filter state for ExamPanel.
 * Persisted in localStorage.
 */
export interface ExamFilterState {
    statusFilter: 'registered' | 'available' | 'opening';
    selectedSubjects: string[];
}

export interface CommandItem {
    id: string;
    type: 'subject' | 'person' | 'page' | 'action';
    title: string;
    subtitle?: string;
    link?: string;
    subjectCode?: string;
    faculty?: string;
    action: () => void;
}

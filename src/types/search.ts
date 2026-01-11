export interface SearchResult {
  id: string;
  title: string;
  type: 'person' | 'page' | 'subject';
  detail?: string;
  link?: string;
  personType?: 'student' | 'teacher' | 'staff' | 'unknown';
  category?: string;
  subjectCode?: string;
}

export const MAX_RECENT_SEARCHES = 5;
export const STORAGE_KEY = 'reis_recent_searches';

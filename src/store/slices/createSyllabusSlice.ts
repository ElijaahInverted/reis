import type { SyllabusSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';
import { fetchSyllabus, findSubjectId } from '../../api/syllabus';

export const createSyllabusSlice: AppSlice<SyllabusSlice> = (set, get) => ({
  syllabuses: {
    cache: {},
    loading: {},
  },
  fetchSyllabus: async (courseCode, courseId, subjectName) => {
    const { cache, loading } = get().syllabuses;
    const currentLang = get().language;

    // 1. Return if already in cache (and language matches) or currently loading
    const cachedData = cache[courseCode];
    if (loading[courseCode] || (cachedData && cachedData.language === currentLang)) return;

    // 2. Set loading state
    set((state) => ({
      syllabuses: {
        ...state.syllabuses,
        loading: { ...state.syllabuses.loading, [courseCode]: true },
      },
    }));

    try {
      // 3. Try IndexedDB first
      const SYLLABUS_VERSION = 2;
      let data = await IndexedDBService.get('syllabuses', courseCode);

      // 4. If not in DB OR language mismatch OR old version, fetch from API
      if (!data || (data as any).language !== currentLang || (data as any).version !== SYLLABUS_VERSION) {
        let activeId = courseId;
        if (!activeId) {
          activeId = await findSubjectId(courseCode, subjectName) || undefined;
        }

        if (activeId) {
          const lang = get().language;
          data = await fetchSyllabus(activeId, lang);
          if (data) {
            await IndexedDBService.set('syllabuses', courseCode, data);
          }
        }
      }

      set((state) => ({
        syllabuses: {
          cache: { 
            ...state.syllabuses.cache, 
            ...(data ? { [courseCode]: data } : {}) 
          },
          loading: { ...state.syllabuses.loading, [courseCode]: false },
        },
      }));
    } catch (error) {
      console.error(`[SyllabusSlice] Failed for ${courseCode}:`, error);
      set((state) => ({
        syllabuses: {
          ...state.syllabuses,
          loading: { ...state.syllabuses.loading, [courseCode]: false },
        },
      }));
    }
  },
});

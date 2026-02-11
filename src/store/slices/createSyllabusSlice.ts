import type { SyllabusSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';
import { fetchSyllabus, findSubjectId } from '../../api/syllabus';
import type { SyllabusRequirements } from '../../types/documents';

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
    console.debug(`[SyllabusSlice] Setting loading=true for ${courseCode}`);
    set((state) => ({
      syllabuses: {
        ...state.syllabuses,
        loading: { ...state.syllabuses.loading, [courseCode]: true },
      },
    }));

    try {
      const SYLLABUS_VERSION = 2;
      console.debug(`[SyllabusSlice] Checking IDB for ${courseCode}`);
      const data = await IndexedDBService.get('syllabuses', courseCode);
      console.debug(`[SyllabusSlice] IDB result for ${courseCode}:`, !!data);
      let activeSyllabus: SyllabusRequirements | undefined = undefined;
      let needsFetch = false;

      if (data && 'cz' in data && 'en' in data) {
          activeSyllabus = currentLang === 'en' ? data.en : data.cz;
          if (activeSyllabus) {
              activeSyllabus.language = activeSyllabus.language === 'cz' ? 'cs' : activeSyllabus.language;
          }
          if (!activeSyllabus || activeSyllabus.version !== SYLLABUS_VERSION) needsFetch = true;
      } else if (data) {
          activeSyllabus = data as SyllabusRequirements;
          activeSyllabus.language = activeSyllabus.language === 'cz' ? 'cs' : activeSyllabus.language;
          if (activeSyllabus.language !== currentLang || activeSyllabus.version !== SYLLABUS_VERSION) {
              needsFetch = true;
          }
      } else {
          needsFetch = true;
      }

      if (!needsFetch && activeSyllabus) {
        console.debug(`[SyllabusSlice] IDB Hit - No fetch needed:`, {
            courseCode,
            storeLang: currentLang,
            syllabusLang: activeSyllabus.language,
            version: activeSyllabus.version
        });
      }

      if (needsFetch) {
        let activeId = courseId;
        if (!activeId) {
          activeId = await findSubjectId(courseCode, subjectName) || undefined;
        }

        if (activeId) {
          try {
            console.debug(`[SyllabusSlice] Starting parallel fetch for ${activeId} (cz, en)`);
            const [czSyllabus, enSyllabus] = await Promise.all([
              fetchSyllabus(activeId, 'cz'),
              fetchSyllabus(activeId, 'en')
            ]);
            console.debug(`[SyllabusSlice] Parallel fetch completed for ${activeId}`);
            
            const dualData = { cz: czSyllabus, en: enSyllabus };
            console.debug(`[SyllabusSlice] Saving to IDB for ${courseCode}`);
            await IndexedDBService.set('syllabuses', courseCode, dualData);
            console.debug(`[SyllabusSlice] Saved to IDB for ${courseCode}`);
            activeSyllabus = currentLang === 'en' ? enSyllabus : czSyllabus;
            if (activeSyllabus) {
                activeSyllabus.language = activeSyllabus.language === 'cz' ? 'cs' : activeSyllabus.language;
            }
          } catch (err) {
            console.error(`[SyllabusSlice] API fetch failed:`, err);
          }
        }
      }

      console.debug(`[SyllabusSlice] Updating state for ${courseCode}, activeSyllabus:`, !!activeSyllabus);
      set((state) => ({
        syllabuses: {
          cache: { 
            ...state.syllabuses.cache, 
            ...(activeSyllabus ? { [courseCode]: activeSyllabus } : {}) 
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

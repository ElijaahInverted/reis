import type { AppSlice, StudyJamsSlice } from '../types';
import { IndexedDBService } from '../../services/storage';
import { fetchKillerCourses, registerAvailability, findAndClaimTutor, deleteAvailability } from '../../api/studyJams';
import { checkStudyJamEligibility } from '../../services/studyJams/studyJamEligibility';
import { getUserParams } from '../../utils/userParams';

const OPT_INS_KEY = 'study_jam_optins';

export const createStudyJamsSlice: AppSlice<StudyJamsSlice> = (set, get) => ({
    isStudyJamOpen: false,
    setIsStudyJamOpen: (isOpen) => set({ isStudyJamOpen: isOpen }),
    isSelectingTime: false,
    setIsSelectingTime: (isSelecting) => set({ isSelectingTime: isSelecting }),
    pendingTimeSelection: null,
    setPendingTimeSelection: (selection) => set({ pendingTimeSelection: selection }),
    studyJamSuggestions: [],
    studyJamOptIns: {},
    studyJamMatch: null,

    loadStudyJamSuggestions: async () => {
        try {
            const killerCourses = await fetchKillerCourses();
            const suggestions = await checkStudyJamEligibility(killerCourses);
            const storedOptIns = await IndexedDBService.get('meta', OPT_INS_KEY) as StudyJamsSlice['studyJamOptIns'] | null;
            const optIns = storedOptIns ?? {};
            const filtered = suggestions.filter(s => !optIns[s.courseCode]);
            set({ studyJamSuggestions: filtered, studyJamOptIns: optIns });
        } catch (e) {
            console.error('[StudyJamsSlice] loadStudyJamSuggestions error', e);
        }
    },

    optInStudyJam: async (courseCode, courseName, role) => {
        const userParams = await getUserParams();
        if (!userParams) return;
        const id = await registerAvailability(userParams.studium, courseCode, role, userParams.obdobi);
        if (!id) return;
        const optIns = { ...get().studyJamOptIns, [courseCode]: { id, role } };
        await IndexedDBService.set('meta', OPT_INS_KEY, optIns);
        set(state => ({
            studyJamOptIns: optIns,
            studyJamSuggestions: state.studyJamSuggestions.filter(s => s.courseCode !== courseCode),
        }));
    },

    requestTutorMatch: async (courseCode, courseName) => {
        const userParams = await getUserParams();
        if (!userParams) return;
        const tutorStudium = await findAndClaimTutor(courseCode, userParams.obdobi, userParams.studium);
        if (tutorStudium) {
            const optIns = { ...get().studyJamOptIns };
            delete optIns[courseCode];
            await IndexedDBService.set('meta', OPT_INS_KEY, optIns);
            set({
                studyJamMatch: { courseCode, courseName },
                studyJamOptIns: optIns,
            });
        } else {
            const id = await registerAvailability(userParams.studium, courseCode, 'tutee', userParams.obdobi);
            if (!id) return;
            const optIns = { ...get().studyJamOptIns, [courseCode]: { id, role: 'tutee' as const } };
            await IndexedDBService.set('meta', OPT_INS_KEY, optIns);
            set(state => ({
                studyJamOptIns: optIns,
                studyJamSuggestions: state.studyJamSuggestions.filter(s => s.courseCode !== courseCode),
            }));
        }
    },

    cancelOptIn: async (courseCode) => {
        const optIn = get().studyJamOptIns[courseCode];
        if (!optIn) return;
        await deleteAvailability(optIn.id);
        const optIns = { ...get().studyJamOptIns };
        delete optIns[courseCode];
        await IndexedDBService.set('meta', OPT_INS_KEY, optIns);
        set({ studyJamOptIns: optIns });
    },

    dismissStudyJamMatch: () => {
        set({ studyJamMatch: null });
    },
});

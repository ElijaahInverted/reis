import type { ClassmatesSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';

export const createClassmatesSlice: AppSlice<ClassmatesSlice> = (set, get) => ({
    classmates: {},
    classmatesAllLoading: {},
    classmatesAllProgress: {},
    classmatesSeminarLoading: {},
    classmatesSeminarProgress: {},

    fetchClassmatesAll: async (courseCode) => {
        if (get().classmatesAllLoading[courseCode]) return;

        set((state) => ({
            classmatesAllLoading: { ...state.classmatesAllLoading, [courseCode]: true },
            classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'initializing' },
        }));

        try {
            const cached = await IndexedDBService.get('classmates', `${courseCode}:all`);
            if (cached !== undefined) {
                set((state) => ({
                    classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), all: cached.all } },
                    classmatesAllLoading: { ...state.classmatesAllLoading, [courseCode]: false },
                    classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'success' },
                }));
                return;
            }

            let subjects = get().subjects;
            let syncStatus = get().syncStatus;

            if (!syncStatus.handshakeDone || !subjects) {
                set((state) => ({ classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'waiting_metadata' } }));
                const { useAppStore } = await import('../useAppStore');
                await new Promise<void>((resolve) => {
                    const unsub = useAppStore.subscribe((s) => {
                        if (s.syncStatus.handshakeDone && s.subjects) {
                            unsub(); subjects = s.subjects; syncStatus = s.syncStatus; resolve();
                        }
                    });
                    setTimeout(() => { unsub(); resolve(); }, 5000);
                });
            }

            if (!subjects?.data[courseCode]?.subjectId && syncStatus.isSyncing) {
                set((state) => ({ classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'waiting_sync' } }));
                const { useAppStore } = await import('../useAppStore');
                await new Promise<void>((resolve) => {
                    const unsub = useAppStore.subscribe((s) => {
                        if (s.subjects?.data[courseCode]?.subjectId || !s.syncStatus.isSyncing) {
                            unsub(); subjects = s.subjects; syncStatus = s.syncStatus; resolve();
                        }
                    });
                    setTimeout(() => { unsub(); resolve(); }, 10000);
                });
            }

            const subject = subjects?.data[courseCode];
            if (!subject?.subjectId) {
                set((state) => ({
                    classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), all: [] } },
                    classmatesAllLoading: { ...state.classmatesAllLoading, [courseCode]: false },
                    classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'success' },
                }));
                return;
            }

            const { getUserParams } = await import('../../utils/userParams');
            const userParams = await getUserParams();
            if (!userParams?.studium || !userParams?.obdobi) throw new Error('User parameters missing');

            const { fetchClassmates } = await import('../../api/classmates');
            set((state) => ({ classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'fetching' } }));

            const all = await fetchClassmates(subject.subjectId, userParams.studium, userParams.obdobi, undefined, (chunk) => {
                set((state) => ({ classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), all: chunk } } }));
            });

            await IndexedDBService.set('classmates', `${courseCode}:all`, { all });
            set((state) => ({
                classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), all } },
                classmatesAllLoading: { ...state.classmatesAllLoading, [courseCode]: false },
                classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'success' },
            }));
        } catch (error) {
            console.error(`[ClassmatesSlice] fetchClassmatesAll failed for ${courseCode}:`, error);
            set((state) => ({
                classmatesAllLoading: { ...state.classmatesAllLoading, [courseCode]: false },
                classmatesAllProgress: { ...state.classmatesAllProgress, [courseCode]: 'error' },
            }));
        }
    },

    fetchClassmatesSeminar: async (courseCode) => {
        if (get().classmatesSeminarLoading[courseCode]) return;

        set((state) => ({
            classmatesSeminarLoading: { ...state.classmatesSeminarLoading, [courseCode]: true },
            classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'initializing' },
        }));

        try {
            const cached = await IndexedDBService.get('classmates', `${courseCode}:seminar`);
            if (cached !== undefined) {
                set((state) => ({
                    classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), seminar: cached.seminar } },
                    classmatesSeminarLoading: { ...state.classmatesSeminarLoading, [courseCode]: false },
                    classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'success' },
                }));
                return;
            }

            let subjects = get().subjects;
            let syncStatus = get().syncStatus;

            if (!syncStatus.handshakeDone || !subjects) {
                set((state) => ({ classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'waiting_metadata' } }));
                const { useAppStore } = await import('../useAppStore');
                await new Promise<void>((resolve) => {
                    const unsub = useAppStore.subscribe((s) => {
                        if (s.syncStatus.handshakeDone && s.subjects) {
                            unsub(); subjects = s.subjects; syncStatus = s.syncStatus; resolve();
                        }
                    });
                    setTimeout(() => { unsub(); resolve(); }, 5000);
                });
            }

            // skupinaId arrives after fetchSeminarGroupIds — wait for it or sync completion
            if (!subjects?.data[courseCode]?.skupinaId && syncStatus.isSyncing) {
                set((state) => ({ classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'waiting_sync' } }));
                const { useAppStore } = await import('../useAppStore');
                await new Promise<void>((resolve) => {
                    const unsub = useAppStore.subscribe((s) => {
                        if (s.subjects?.data[courseCode]?.skupinaId || !s.syncStatus.isSyncing) {
                            unsub(); subjects = s.subjects; syncStatus = s.syncStatus; resolve();
                        }
                    });
                    setTimeout(() => { unsub(); resolve(); }, 15000);
                });
            }

            const subject = subjects?.data[courseCode];
            if (!subject?.skupinaId || !subject?.subjectId) {
                // No seminar group — cache empty so we skip this path next time
                await IndexedDBService.set('classmates', `${courseCode}:seminar`, { seminar: [] });
                set((state) => ({
                    classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), seminar: [] } },
                    classmatesSeminarLoading: { ...state.classmatesSeminarLoading, [courseCode]: false },
                    classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'success' },
                }));
                return;
            }

            const { getUserParams } = await import('../../utils/userParams');
            const userParams = await getUserParams();
            if (!userParams?.studium || !userParams?.obdobi) throw new Error('User parameters missing');

            const { fetchClassmates } = await import('../../api/classmates');
            set((state) => ({ classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'fetching' } }));

            const seminar = await fetchClassmates(subject.subjectId, userParams.studium, userParams.obdobi, subject.skupinaId, (chunk) => {
                set((state) => ({ classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), seminar: chunk } } }));
            });

            await IndexedDBService.set('classmates', `${courseCode}:seminar`, { seminar });
            set((state) => ({
                classmates: { ...state.classmates, [courseCode]: { ...(state.classmates[courseCode] ?? {}), seminar } },
                classmatesSeminarLoading: { ...state.classmatesSeminarLoading, [courseCode]: false },
                classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'success' },
            }));
        } catch (error) {
            console.error(`[ClassmatesSlice] fetchClassmatesSeminar failed for ${courseCode}:`, error);
            set((state) => ({
                classmatesSeminarLoading: { ...state.classmatesSeminarLoading, [courseCode]: false },
                classmatesSeminarProgress: { ...state.classmatesSeminarProgress, [courseCode]: 'error' },
            }));
        }
    },

    invalidateClassmates: () => {
        set({ classmates: {}, classmatesAllLoading: {}, classmatesAllProgress: {}, classmatesSeminarLoading: {}, classmatesSeminarProgress: {} });
    },
});

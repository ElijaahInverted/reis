import type { SuccessRateSlice, AppSlice } from '../types';
import { getStoredSuccessRates, fetchSubjectSuccessRates } from '../../api/successRate';
import { loggers } from '../../utils/logger';

export const createSuccessRateSlice: AppSlice<SuccessRateSlice> = (set, get) => ({
    successRates: {},
    successRatesLoading: {},
    successRatesGlobalLoaded: false,
    fetchSuccessRateBatch: async (courseCodes) => {
        const missing = courseCodes.filter(c => !get().successRates[c] && !get().successRatesLoading[c]);
        if (missing.length === 0) return;

        try {
            const stored = await getStoredSuccessRates();
            if (stored) set({ successRatesGlobalLoaded: true });

            const fromCache: Record<string, import('../../types/documents').SubjectSuccessRate> = {};
            const toFetch: string[] = [];
            for (const code of missing) {
                if (stored?.data[code]) fromCache[code] = stored.data[code];
                else toFetch.push(code);
            }

            if (Object.keys(fromCache).length > 0) {
                set(state => ({ successRates: { ...state.successRates, ...fromCache } }));
            }

            if (toFetch.length > 0) {
                const result = await fetchSubjectSuccessRates(toFetch);
                const fetched: Record<string, import('../../types/documents').SubjectSuccessRate> = {};
                for (const code of toFetch) {
                    if (result.data[code]) fetched[code] = result.data[code];
                }
                if (Object.keys(fetched).length > 0) {
                    set(state => ({ successRates: { ...state.successRates, ...fetched } }));
                }
            }
        } catch (err) {
            loggers.ui.error('[SuccessRateSlice] Batch fetch failed:', err);
        }
    },
    fetchSuccessRate: async (courseCode) => {
        if (get().successRatesLoading[courseCode]) return;

        set(state => ({
            successRatesLoading: { ...state.successRatesLoading, [courseCode]: true }
        }));

        try {
            // Try storage first
            const stored = await getStoredSuccessRates();
            if (stored) {
                set({ successRatesGlobalLoaded: true });
            }

            if (stored?.data[courseCode]) {
                set(state => ({
                    successRates: { ...state.successRates, [courseCode]: stored.data[courseCode] },
                    successRatesLoading: { ...state.successRatesLoading, [courseCode]: false }
                }));
                return;
            }

            // Not cached — fetch from API
            loggers.ui.info('[SuccessRateSlice] Fetching from API:', courseCode);
            const result = await fetchSubjectSuccessRates([courseCode]);
            set(state => ({
                successRates: {
                    ...state.successRates,
                    ...(result.data[courseCode] ? { [courseCode]: result.data[courseCode] } : {})
                },
                successRatesLoading: { ...state.successRatesLoading, [courseCode]: false }
            }));
        } catch (err) {
            loggers.ui.error('[SuccessRateSlice] Fetch failed:', err);
            set(state => ({
                successRatesLoading: { ...state.successRatesLoading, [courseCode]: false }
            }));
        }
    },
});

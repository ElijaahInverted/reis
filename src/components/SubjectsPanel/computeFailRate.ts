import type { SubjectSuccessRate } from '@/types/documents';

/** Avg fail rate over last 3 semesters using "Všechny termíny" aggregate. Returns 0-100 or null. */
export function computeFailRate(sr: SubjectSuccessRate | undefined): number | null {
  if (!sr?.stats?.length) return null;
  const recent = sr.stats.slice(0, 3);
  let totalPass = 0, totalFail = 0;
  for (const sem of recent) {
    const allTerms = sem.terms.find(t => t.term === 'Všechny termíny');
    if (allTerms) { totalPass += allTerms.pass; totalFail += allTerms.fail; }
    else { totalPass += sem.totalPass; totalFail += sem.totalFail; }
  }
  const total = totalPass + totalFail;
  if (total < 10) return null; // Too few students for meaningful data
  return Math.round((totalFail / total) * 100);
}

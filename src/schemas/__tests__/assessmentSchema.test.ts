import { describe, it, expect } from 'vitest';
import { AssessmentSchema } from '../assessmentSchema';

describe('AssessmentSchema', () => {
    const goldStandardAssessment = {
        name: 'Průběžný test 1',
        score: 15.5,
        maxScore: 20,
        successRate: 77.5,
        submittedDate: '20.01.2026',
        teacher: 'Jan Novák',
        detailUrl: '/auth/student/assessment_detail.pl?id=123'
    };

    it('validates the "Gold Standard" assessment data', () => {
        const result = AssessmentSchema.safeParse(goldStandardAssessment);
        expect(result.success).toBe(true);
    });

    it('normalizes scores from messy strings using coercion', () => {
        const dataWithStrings = {
            ...goldStandardAssessment,
            score: '15,5', // Messy string from IS
            maxScore: '20',
            successRate: ' 77.5 % '
        };
        const result = AssessmentSchema.safeParse(dataWithStrings);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.score).toBe(15.5);
            expect(result.data.maxScore).toBe(20);
            expect(result.data.successRate).toBe(77.5);
        }
    });

    it('rejects non-numeric scores', () => {
        const badData = {
            ...goldStandardAssessment,
            score: 'not-a-number'
        };
        const result = AssessmentSchema.safeParse(badData);
        expect(result.success).toBe(false);
    });
});

import { z } from 'zod';

/**
 * Handles Czech number formatting (commas to dots) and coercion.
 */
const CzechNumberSchema = z.union([z.number(), z.string()])
    .refine((val) => {
        if (typeof val === 'number') return true;
        const clean = val.replace(',', '.').replace(/[^0-9.-]/g, '');
        return clean.length > 0 && !isNaN(parseFloat(clean));
    }, { message: "Invalid number format" })
    .transform((val) => {
        if (typeof val === 'number') return val;
        return parseFloat(val.replace(',', '.').replace(/[^0-9.-]/g, ''));
    });

export const AssessmentSchema = z.object({
    name: z.string().transform(s => s.trim()),
    score: CzechNumberSchema,
    maxScore: CzechNumberSchema,
    successRate: CzechNumberSchema,
    submittedDate: z.string().transform(s => s.trim()),
    teacher: z.string().transform(s => s.trim()),
    detailUrl: z.string().optional(),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

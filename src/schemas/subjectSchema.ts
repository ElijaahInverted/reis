import { z } from 'zod';

export const SubjectInfoSchema = z.object({
    displayName: z.string().transform(s => s.trim()),
    fullName: z.string(),
    subjectCode: z.string(),
    subjectId: z.string().optional(),
    folderUrl: z.string().url(),
    fetchedAt: z.string().datetime().or(z.string()), // Flexible for ISO strings
});

export const SubjectsDataSchema = z.object({
    version: z.literal(1),
    lastUpdated: z.string().datetime().or(z.string()),
    data: z.record(z.string(), SubjectInfoSchema),
});

export type SubjectInfo = z.infer<typeof SubjectInfoSchema>;
export type SubjectsData = z.infer<typeof SubjectsDataSchema>;

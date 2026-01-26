import { z } from 'zod';

export const CourseMetadataSchema = z.object({
    credits: z.string().nullable(),
    garant: z.string().nullable(),
    teachers: z.array(z.object({
        name: z.string().transform(s => s.trim()),
        roles: z.string().transform(s => s.trim()),
    })),
    status: z.string().nullable(),
});

export const SyllabusRequirementsSchema = z.object({
    version: z.literal(1),
    courseId: z.string().optional(),
    requirementsText: z.string(),
    requirementsTable: z.array(z.array(z.string())),
    courseInfo: CourseMetadataSchema.optional(),
});

export type SyllabusRequirements = z.infer<typeof SyllabusRequirementsSchema>;
export type CourseMetadata = z.infer<typeof CourseMetadataSchema>;

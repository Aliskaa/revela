import { z } from 'zod';

export const adminDashboardSchema = z.object({
    total_responses: z.number().int(),
    total_participants: z.number().int(),
    total_companies: z.number().int(),
    by_questionnaire: z.record(
        z.string(),
        z.object({
            title: z.string(),
            count: z.number().int(),
            last_submitted_at: z.string().nullable(),
        }),
    ),
});
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;

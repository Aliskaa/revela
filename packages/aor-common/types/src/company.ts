import { z } from 'zod';

export const companySchema = z.object({
    id: z.number().int(),
    name: z.string(),
    contact_name: z.string().nullable(),
    contact_email: z.string().nullable(),
    participant_count: z.number().int(),
    avatar_url: z.string().nullable(),
});
export type Company = z.infer<typeof companySchema>;

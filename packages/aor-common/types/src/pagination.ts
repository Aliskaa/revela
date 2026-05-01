import { z } from 'zod';

export const paginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        total: z.number().int(),
        page: z.number().int(),
        pages: z.number().int(),
        per_page: z.number().int(),
    });

export type PaginatedResult<T> = {
    items: T[];
    total: number;
    page: number;
    pages: number;
    per_page: number;
};

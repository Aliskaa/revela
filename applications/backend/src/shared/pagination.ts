// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Generic pagination envelope shared by repository list operations. */
export type Paginated<T> = {
    items: T[];
    total: number;
    page: number;
    pages: number;
    perPage: number;
};

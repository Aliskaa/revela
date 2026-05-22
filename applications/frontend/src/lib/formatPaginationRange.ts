/** Libellé « 1–10 sur 42 » pour les en-têtes de listes paginées. */
export function formatPaginationRange(page: number, rowsPerPage: number, total: number): string {
    if (total === 0) return '0 sur 0';
    const start = page * rowsPerPage + 1;
    const end = Math.min((page + 1) * rowsPerPage, total);
    return `${start}–${end} sur ${total}`;
}

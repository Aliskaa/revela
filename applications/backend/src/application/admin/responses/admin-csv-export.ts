// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Résultat d’export CSV côté application (l’adaptateur HTTP pose les en-têtes). */
export type AdminCsvExport = {
    body: string;
    filename: string;
};

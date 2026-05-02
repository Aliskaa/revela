// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/**
 * Parse un CSV utf-8 séparé par « ; » (mêmes règles que `parseSemicolonCsv`
 * côté backend dans `@aor/utils`). Strip BOM, ignore lignes vides.
 */
export function parseSemicolonCsvText(text: string): Array<Record<string, string>> {
    const cleaned = text.replace(/^﻿/, '');
    const lines = cleaned.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
        return [];
    }
    const headers = lines[0].split(';').map(h => h.trim());
    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';');
        const row: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = (cols[j] ?? '').trim();
        }
        rows.push(row);
    }
    return rows;
}

export type ParticipantImportPreviewRow = {
    line: number;
    firstName: string;
    lastName: string;
    email: string;
    organisation: string | null;
    direction: string | null;
    service: string | null;
    functionLevel: string | null;
    valid: boolean;
    error: string | null;
};

const VALID_FUNCTION_LEVELS = new Set(['direction', 'middle_management', 'frontline_manager']);

/**
 * Transforme les rows brutes d'un CSV en un aperçu typé pour la confirmation
 * d'import des participants. Une ligne est invalide si l'un des champs requis
 * (prénom, nom, email) est vide.
 */
export function buildParticipantImportPreview(rows: Array<Record<string, string>>): ParticipantImportPreviewRow[] {
    return rows.map((row, idx) => {
        const firstName = (row.first_name ?? '').trim();
        const lastName = (row.last_name ?? '').trim();
        const email = (row.email ?? '').trim().toLowerCase();
        const organisation = (row.organisation ?? '').trim() || null;
        const direction = (row.direction ?? '').trim() || null;
        const service = (row.service ?? '').trim() || null;
        const rawFunctionLevel = (row.function_level ?? '').trim().toLowerCase();
        const functionLevel = VALID_FUNCTION_LEVELS.has(rawFunctionLevel) ? rawFunctionLevel : null;

        let error: string | null = null;
        if (!firstName || !lastName || !email) {
            error = 'Prénom, nom et email requis.';
        }

        return {
            line: idx + 2,
            firstName,
            lastName,
            email,
            organisation,
            direction,
            service,
            functionLevel,
            valid: error === null,
            error,
        };
    });
}

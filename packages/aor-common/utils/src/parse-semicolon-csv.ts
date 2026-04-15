/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

export const parseSemicolonCsv = (buffer: Buffer): Array<Record<string, string>> => {
    const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
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
};

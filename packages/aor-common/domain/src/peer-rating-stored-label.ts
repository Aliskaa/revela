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

const PEER_RATING_NAME_MAX_LEN = 255;

export const parsePeerRatingTargetParticipantId = (storedName: string): number | null => {
    const t = storedName.trim();
    if (!t.startsWith('pid:')) {
        return null;
    }
    const afterPrefix = t.slice('pid:'.length);
    const pipe = afterPrefix.indexOf('|');
    if (pipe === -1) {
        return null;
    }
    const id = Number.parseInt(afterPrefix.slice(0, pipe), 10);
    return Number.isFinite(id) ? id : null;
};

export const displayPeerRatingStoredLabel = (storedName: string): string => {
    const t = storedName.trim();
    const id = parsePeerRatingTargetParticipantId(t);
    if (id === null) {
        return t;
    }
    const pipe = t.indexOf('|');
    if (pipe === -1) {
        return t;
    }
    const rest = t.slice(pipe + 1).trim();
    return rest.length > 0 ? rest : `Participant #${String(id)}`;
};

export const formatPeerRatingStoredName = (targetParticipantId: number, userDisplayLabel: string): string => {
    const prefix = `pid:${String(targetParticipantId)}|`;
    const restMax = Math.max(0, PEER_RATING_NAME_MAX_LEN - prefix.length);
    const rest = userDisplayLabel.trim().slice(0, restMax);
    return `${prefix}${rest}`;
};

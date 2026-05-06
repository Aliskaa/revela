// Table de conversion F -> P du livret participant (Étape III « Transparence »).
// Source de vérité unique dans `@aor/types` : partagée backend (calcul) + frontend (affichage).
import { TRANSPARENCY_F_TO_P } from '@aor/types';

export type TransparencyMatrixRow = {
    readonly scientific: number | null;
    readonly peers: ReadonlyArray<number | null>;
};

export type TransparencyRowDetail = {
    readonly scientific: number;
    readonly p: number;
    readonly ecarts: ReadonlyArray<number>;
};

export type TransparencyComputation = {
    readonly score: number;
    readonly peerCount: number;
    readonly totalEcart: number;
    readonly totalP: number;
    readonly rows: ReadonlyArray<TransparencyRowDetail>;
};

const isInteger09 = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 9;

/**
 * Calcule le score de transparence (P23, livret participant Étape III).
 *
 * Pour chaque ligne r dont la valeur scientifique F_r est définie :
 *   - P_r = F_TO_P[F_r]                       (table de conversion)
 *   - écart_r,j = |peer_r,j - F_r|            pour chaque pair j ayant noté la ligne
 * Σ écart = Σ_r,j écart_r,j (correspond au « total des colonnes K-N » multiplié par 100 dans le livret)
 * Σ P     = Σ_r P_r
 * Score   = clamp(100 - floor(100 × Σécart / (Σ P × peerCount)), 0, 100)
 *
 * Le `floor` de la fraction (et non un round du résultat final) reproduit l'arrondi du
 * livret participant : pour Σécart = 87, Σ P = 71, peerCount = 3 → 100 - ⌊8700/213⌋
 * = 100 - 40 = 60.
 *
 * Renvoie `null` si le score n'est pas calculable (aucun pair, aucune ligne F valide,
 * ou Σ P = 0).
 */
export const computeTransparencyScore = (params: {
    rows: ReadonlyArray<TransparencyMatrixRow>;
    peerCount: number;
}): TransparencyComputation | null => {
    if (!Number.isInteger(params.peerCount) || params.peerCount <= 0) {
        return null;
    }

    let totalEcart = 0;
    let totalP = 0;
    const rowDetails: TransparencyRowDetail[] = [];

    for (const row of params.rows) {
        if (row.scientific === null || !isInteger09(row.scientific)) {
            continue;
        }
        const f = row.scientific;
        const p = TRANSPARENCY_F_TO_P[f];
        if (p === undefined) {
            continue;
        }
        const ecarts: number[] = [];
        for (const peer of row.peers) {
            if (peer === null || !isInteger09(peer)) {
                continue;
            }
            ecarts.push(Math.abs(peer - f));
        }
        totalEcart += ecarts.reduce((a, b) => a + b, 0);
        totalP += p;
        rowDetails.push({ scientific: f, p, ecarts });
    }

    if (totalP === 0) {
        return null;
    }

    const ratio = Math.floor((100 * totalEcart) / (totalP * params.peerCount));
    const score = Math.max(0, Math.min(100, 100 - ratio));

    return {
        score,
        peerCount: params.peerCount,
        totalEcart,
        totalP,
        rows: rowDetails,
    };
};

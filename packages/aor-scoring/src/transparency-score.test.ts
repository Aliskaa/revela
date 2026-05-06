import assert from 'node:assert/strict';
import test from 'node:test';

import { computeTransparencyScore } from './transparency-score';

test('photo livret : Σécart=87, Σ P=71, 3 pairs → score 60', () => {
    // Cas direct : on construit un jeu de lignes minimal qui produit Σécart=87 et Σ P=71.
    // Plus simple : on fournit explicitement les lignes ci-dessous et on assert le score.
    // Σ P = 71 ; on choisit 12 lignes avec F variés pour atteindre 71.
    // F: [9,8,7,6,5,4,3,2,1,0,5,4] -> P: [0,1,2,3,4,5,6,7,8,9,4,5] -> Σ P = 54... ajustons
    // F: [0,1,2,3,4,5,6,7,8,9,5,4] -> P: [9,8,7,6,5,4,3,2,1,0,4,5] -> Σ P = 54
    // On vise 71 : 12 lignes à P moyen ≈ 5.9. Choisissons F=3 (P=6) sur 12 lignes : Σ P=72
    // Ajustons à 71 : 11 lignes F=3 + 1 ligne F=4 → Σ P = 11*6 + 5 = 71 ✓
    const rows = [
        ...Array.from({ length: 11 }, () => ({ scientific: 3, peers: [3, 3, 3] })),
        { scientific: 4, peers: [4, 4, 4] as number[] },
    ];
    // On injecte 87 unités d'écart total. Plus pratique : un seul pair, une seule ligne, écart=8.
    // Mais on a 11 lignes×3 pairs = 33 cellules. Distribuons 87 : ex. 29 cellules avec écart 3.
    // Plus simple : sur la 1re ligne (F=3), donner peer[0]=3+e1, peer[1]=3+e2, peer[2]=3+e3
    // sur la 2e ligne idem, etc. — on pose tous les peers à 3+pas selon une distribution.
    // Bornes : peer ∈ [0,9], donc écart max par cellule = max(9-F, F) = 6 (pour F=3).
    // Cible : 87 répartis sur 12 lignes × 3 pairs = 36 cellules ; 87/36 ≈ 2.4.
    // Stratégie : 36 cellules × 2 = 72, puis +15 répartis. On met écart=3 sur 15 cellules,
    // écart=2 sur 21 cellules, total = 15*3 + 21*2 = 45 + 42 = 87 ✓
    let injected = 0;
    let big = 15;
    let small = 21;
    for (const row of rows) {
        for (let j = 0; j < row.peers.length; j += 1) {
            const f = row.scientific;
            if (big > 0) {
                row.peers[j] = f + 3 <= 9 ? f + 3 : f - 3;
                big -= 1;
                injected += 3;
            } else if (small > 0) {
                row.peers[j] = f + 2 <= 9 ? f + 2 : f - 2;
                small -= 1;
                injected += 2;
            }
        }
    }
    assert.equal(injected, 87, 'set-up incorrect : Σécart attendu = 87');

    const result = computeTransparencyScore({ rows, peerCount: 3 });
    assert.ok(result, 'score doit être calculable');
    assert.equal(result.totalEcart, 87);
    assert.equal(result.totalP, 71);
    assert.equal(result.peerCount, 3);
    assert.equal(result.score, 60); // 100 - ⌊8700/213⌋ = 100 - 40 = 60
});

test('alignement parfait pair=F → score 100', () => {
    const rows = [
        { scientific: 5, peers: [5, 5, 5] },
        { scientific: 2, peers: [2, 2, 2] },
        { scientific: 7, peers: [7, 7, 7] },
    ];
    const result = computeTransparencyScore({ rows, peerCount: 3 });
    assert.ok(result);
    assert.equal(result.totalEcart, 0);
    assert.equal(result.score, 100);
});

test('aucun pair → null', () => {
    const rows = [{ scientific: 5, peers: [] }];
    const result = computeTransparencyScore({ rows, peerCount: 0 });
    assert.equal(result, null);
});

test('aucune ligne F valide → null', () => {
    const rows = [
        { scientific: null, peers: [3, 4, 5] },
        { scientific: null, peers: [6, 7, 8] },
    ];
    const result = computeTransparencyScore({ rows, peerCount: 3 });
    assert.equal(result, null);
});

test('ligne F=null ignorée, autres lignes prises en compte', () => {
    const rows = [
        { scientific: null, peers: [9, 9, 9] }, // ignorée
        { scientific: 3, peers: [3, 3, 3] }, // P=6, écart=0
    ];
    const result = computeTransparencyScore({ rows, peerCount: 3 });
    assert.ok(result);
    assert.equal(result.totalP, 6);
    assert.equal(result.totalEcart, 0);
    assert.equal(result.score, 100);
});

test("cellule pair null ignorée (peer n'a pas répondu cette ligne)", () => {
    const rows = [{ scientific: 3, peers: [3, null, 3] }];
    const result = computeTransparencyScore({ rows, peerCount: 3 });
    assert.ok(result);
    assert.equal(result.totalEcart, 0);
});

test('désaccord maximal pair=opposé(F) → score 0', () => {
    // F=0 → P=9 ; 1 pair vote 9 → écart=9 = P. Ratio = 100 → score 0.
    const rows = [{ scientific: 0, peers: [9] }];
    const result = computeTransparencyScore({ rows, peerCount: 1 });
    assert.ok(result);
    assert.equal(result.score, 0);
});

test('table de conversion F→P : extrémités', () => {
    // P = max(F, 9-F) — écart max théorique. F=0 → P=9, F=9 → P=9, F=4 → P=5, F=5 → P=5.
    const result0 = computeTransparencyScore({ rows: [{ scientific: 0, peers: [0] }], peerCount: 1 });
    assert.ok(result0);
    assert.equal(result0.rows[0]?.p, 9);

    const result9 = computeTransparencyScore({ rows: [{ scientific: 9, peers: [9] }], peerCount: 1 });
    assert.ok(result9);
    assert.equal(result9.rows[0]?.p, 9);

    const result4 = computeTransparencyScore({ rows: [{ scientific: 4, peers: [4] }], peerCount: 1 });
    assert.ok(result4);
    assert.equal(result4.rows[0]?.p, 5);

    const result5 = computeTransparencyScore({ rows: [{ scientific: 5, peers: [5] }], peerCount: 1 });
    assert.ok(result5);
    assert.equal(result5.rows[0]?.p, 5);
});

test('plusieurs pairs : Σécart agrégé sur toutes les cellules', () => {
    // F=4 → P=5 ; 2 pairs : (4, 7) → écarts 0 et 3 → totalEcart = 3 ; ΣP=5, peerCount=2
    // Score = 100 - ⌊300/(5*2)⌋ = 100 - ⌊30⌋ = 70
    const rows = [{ scientific: 4, peers: [4, 7] }];
    const result = computeTransparencyScore({ rows, peerCount: 2 });
    assert.ok(result);
    assert.equal(result.totalEcart, 3);
    assert.equal(result.totalP, 5);
    assert.equal(result.score, 70);
});

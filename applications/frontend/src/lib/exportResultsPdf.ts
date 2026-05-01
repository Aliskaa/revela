import { jsPDF } from 'jspdf';

import type { DimensionView } from '@aor/types';

// ── AOR brand colours ───────────────────────────────────────────────
const BLUE = { r: 15, g: 24, b: 152 } as const;
const YELLOW = { r: 255, g: 204, b: 0 } as const;
const GREEN = { r: 4, g: 120, b: 87 } as const;
const GREY = { r: 100, g: 116, b: 139 } as const;
const LIGHT_BG = { r: 244, g: 246, b: 251 } as const;

const PEER_COLORS_PDF = [
    { r: 255, g: 204, b: 0 },
    { r: 255, g: 170, b: 0 },
    { r: 230, g: 150, b: 0 },
    { r: 200, g: 130, b: 0 },
    { r: 180, g: 115, b: 0 },
];

// ── Types ───────────────────────────────────────────────────────────
type ExportParams = {
    participantName: string;
    campaignName: string;
    coachName: string;
    questionnaireId: string;
    peerCount: number;
    likertMax: number;
    dimensions: DimensionView[];
};

// ── Helpers ─────────────────────────────────────────────────────────
const fmt = (v: number | null): string => (v != null ? String(v) : '–');

const BAR_MAX_W = 60;

const drawBar = (
    doc: jsPDF,
    x: number,
    y: number,
    value: number | null,
    max: number,
    color: { r: number; g: number; b: number }
) => {
    const barH = 4;
    // background track
    doc.setFillColor(LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b);
    doc.roundedRect(x, y, BAR_MAX_W, barH, 2, 2, 'F');
    // filled portion
    if (value != null && value > 0) {
        const w = Math.max(2, (value / max) * BAR_MAX_W);
        doc.setFillColor(color.r, color.g, color.b);
        doc.roundedRect(x, y, w, barH, 2, 2, 'F');
    }
    // value text
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(fmt(value), x + BAR_MAX_W + 3, y + 3.2);
};

// ── Main export function ────────────────────────────────────────────
export const exportResultsPdf = (params: ExportParams) => {
    const { participantName, campaignName, coachName, questionnaireId, peerCount, likertMax, dimensions } = params;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setLanguage('fr-FR');
    doc.setProperties({
        title: `Synthèse Révéla — ${campaignName}`,
        subject: 'Synthèse des résultats psychométriques',
        author: participantName,
        creator: 'Révéla',
        keywords: `Révéla, ${questionnaireId}, ${campaignName}`,
    });
    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 18;
    const contentW = pageW - marginX * 2;
    let y = 0;

    const checkPage = (needed: number) => {
        if (y + needed > 275) {
            doc.addPage();
            y = 20;
        }
    };

    // ── Header band ─────────────────────────────────────────────────
    doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
    doc.rect(0, 0, pageW, 38, 'F');

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Révéla', marginX, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(YELLOW.r, YELLOW.g, YELLOW.b);
    doc.text('Synthèse des résultats', marginX, 24);

    doc.setFontSize(9);
    doc.setTextColor(200, 200, 230);
    doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), marginX, 32);

    y = 48;

    // ── Info block ──────────────────────────────────────────────────
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
    doc.text(campaignName, marginX, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(GREY.r, GREY.g, GREY.b);

    const infoLines = [
        `Participant : ${participantName}`,
        `Coach : ${coachName}`,
        `Questionnaire : ${questionnaireId}`,
        `Sources : Auto-évaluation · ${String(peerCount)} pair${peerCount !== 1 ? 's' : ''} · Test scientifique`,
    ];
    for (const line of infoLines) {
        doc.text(line, marginX, y);
        y += 5;
    }

    y += 4;

    // separator
    doc.setDrawColor(BLUE.r, BLUE.g, BLUE.b);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + contentW, y);
    y += 8;

    // ── Legend ───────────────────────────────────────────────────────
    const allPeerLabels = new Set<string>();
    for (const dim of dimensions) {
        for (const row of dim.rows) {
            for (const p of row.peers) {
                if (p.value !== null) allPeerLabels.add(p.label);
            }
        }
    }

    const legendItems: Array<{ label: string; color: { r: number; g: number; b: number } }> = [
        { label: 'Auto-évaluation', color: BLUE },
    ];
    let peerIdx = 0;
    for (const pLabel of allPeerLabels) {
        legendItems.push({ label: pLabel, color: PEER_COLORS_PDF[peerIdx % PEER_COLORS_PDF.length] });
        peerIdx++;
    }
    legendItems.push({ label: 'Test scientifique', color: GREEN });

    doc.setFontSize(8);
    let legendX = marginX;
    for (const item of legendItems) {
        doc.setFillColor(item.color.r, item.color.g, item.color.b);
        doc.circle(legendX + 1.5, y - 1, 1.5, 'F');
        doc.setTextColor(GREY.r, GREY.g, GREY.b);
        doc.text(item.label, legendX + 5, y);
        legendX += doc.getTextWidth(item.label) + 14;
        if (legendX > pageW - 40) {
            legendX = marginX;
            y += 5;
        }
    }
    y += 8;

    // ── Dimensions ──────────────────────────────────────────────────
    for (const dim of dimensions) {
        const rowsHeight = dim.rows.length * 22 + 14;
        const ecartsHeight = dim.ecarts.length > 0 ? dim.ecarts.length * 6 + 14 : 0;
        checkPage(rowsHeight + ecartsHeight + 10);

        // Dimension title
        doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
        doc.roundedRect(marginX, y, contentW, 8, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(dim.name, marginX + 4, y + 5.8);
        y += 12;

        // Score rows
        for (const row of dim.rows) {
            checkPage(24);

            // Label
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(row.label, marginX + 2, y);
            y += 5;

            const barX = marginX + 30;

            // Auto bar
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
            doc.text('Auto', marginX + 2, y + 3);
            drawBar(doc, barX, y, row.self, likertMax, BLUE);
            y += 6;

            // Individual peer bars
            for (let pi = 0; pi < row.peers.length; pi++) {
                const peer = row.peers[pi];
                if (peer.value === null) continue;
                const pColor = PEER_COLORS_PDF[pi % PEER_COLORS_PDF.length];
                doc.setTextColor(pColor.r - 40, pColor.g - 40, Math.max(0, pColor.b - 40));
                const peerName = peer.label.length > 10 ? `${peer.label.slice(0, 9)}…` : peer.label;
                doc.text(peerName, marginX + 2, y + 3);
                drawBar(doc, barX, y, peer.value, likertMax, pColor);
                y += 6;
            }

            // Test bar
            if (row.scientific !== null) {
                doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
                doc.text('Test', marginX + 2, y + 3);
                drawBar(doc, barX, y, row.scientific, likertMax, GREEN);
                y += 6;
            }

            y += 3;
        }

        // Écarts section
        if (dim.ecarts.length > 0) {
            checkPage(dim.ecarts.length * 6 + 10);

            doc.setFillColor(LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b);
            const ecartBlockH = dim.ecarts.length * 6 + 8;
            doc.roundedRect(marginX, y, contentW, ecartBlockH, 2, 2, 'F');

            y += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text('Analyse des écarts', marginX + 4, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            for (const ecart of dim.ecarts) {
                const label = `Écart : ${String(ecart.value)}`;
                const message = ecart.value === 0 ? 'Pas de différence significative.' : ecart.message;

                if (ecart.value === 0) {
                    doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
                } else {
                    doc.setTextColor(YELLOW.r - 40, YELLOW.g - 40, 0);
                }
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(label, marginX + 4, y);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(GREY.r, GREY.g, GREY.b);
                const labelW = doc.getTextWidth(label);
                doc.text(`  ${message}`, marginX + 4 + labelW, y);
                y += 6;
            }

            y += 4;
        }

        y += 6;
    }

    // ── Footer ──────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(GREY.r, GREY.g, GREY.b);
        doc.text(`Révéla — AOR Conseil · Page ${String(p)}/${String(pageCount)}`, marginX, 290);
    }

    // ── Save ────────────────────────────────────────────────────────
    const safeName = campaignName.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').replace(/\s+/g, '_');
    doc.save(`Revela_Resultats_${safeName}.pdf`);
};

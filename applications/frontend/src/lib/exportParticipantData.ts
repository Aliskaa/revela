// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { jsPDF } from 'jspdf';

import type { ParticipantSelfDataExport } from '@aor/types';

/**
 * Helpers de téléchargement RGPD de l'export « mes données » côté participant.
 *
 * Le backend (`GET /participant/me/export`) retourne le `ParticipantSelfDataExport` brut.
 * Ces helpers ne font *pas* de fetch — ils prennent le payload déjà téléchargé et
 * déclenchent soit un download JSON, soit la génération d'un PDF côté client (jsPDF).
 *
 * Choix d'archi : générer le PDF côté frontend évite d'embarquer une dépendance PDF côté
 * backend (PDFKit, Puppeteer) et d'opérer une route de rendu serveur. Le payload JSON est
 * la source unique de vérité.
 */

const FUNCTION_LEVEL_FR: Record<string, string> = {
    direction: 'Direction',
    middle_management: 'Management intermédiaire',
    frontline_manager: 'Manager de proximité',
};

const SUBMISSION_KIND_FR: Record<string, string> = {
    self_rating: 'Auto-évaluation',
    peer_rating: 'Feedback de pairs',
    element_humain: 'Élément humain',
};

const ROLE_FR: Record<string, string> = {
    subject: 'Sujet (résultat sur vous)',
    rated: 'Évalué·e par un pair',
    rater: 'Évaluateur (vous avez noté un pair)',
    submitter: 'Auteur via lien d’invitation',
};

const formatDateFr = (iso: string | null): string => {
    if (!iso) return '–';
    try {
        return new Date(iso).toLocaleDateString('fr-FR');
    } catch {
        return iso;
    }
};

const formatDateTimeFr = (iso: string | null): string => {
    if (!iso) return '–';
    try {
        return new Date(iso).toLocaleString('fr-FR');
    } catch {
        return iso;
    }
};

const slugify = (raw: string): string =>
    raw
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

/**
 * Calcule un nom de fichier stable pour l'export (JSON ou PDF), basé sur le nom du
 * participant et la date de génération. Évite les caractères spéciaux pour la portabilité
 * cross-OS (Windows ne tolère pas `:` dans les noms de fichiers).
 */
const buildExportFilename = (data: ParticipantSelfDataExport, extension: 'json' | 'pdf'): string => {
    const slug = slugify(`${data.profile.first_name} ${data.profile.last_name}`) || 'export';
    const datePart = data.generated_at.slice(0, 10); // YYYY-MM-DD
    return `revela-export-${slug}-${datePart}.${extension}`;
};

const triggerDownload = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Télécharge l'export sous forme de fichier JSON pretty-printed (indentation 2 espaces).
 * Format brut adapté à la portabilité (Article 20 RGPD) — un autre service peut réimporter
 * ces données s'il en a connaissance du schéma.
 */
export function downloadParticipantExportJson(data: ParticipantSelfDataExport): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, buildExportFilename(data, 'json'));
}

/**
 * Génère et télécharge un PDF lisible humain (A4) à partir du même payload. Mise en page
 * sobre : titre, sections (Profil / Campagnes / Réponses), tableaux. Le PDF n'est pas le
 * format de portabilité au sens RGPD strict (le JSON l'est), mais il est plus accessible
 * pour un participant qui souhaite simplement consulter ou imprimer ses données.
 */
export function downloadParticipantExportPdf(data: ParticipantSelfDataExport): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const lineHeight = 16;
    let cursorY = margin;

    const ensureSpace = (needed: number) => {
        if (cursorY + needed > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
    };

    const writeLine = (text: string, options?: { bold?: boolean; size?: number; spacing?: number }) => {
        ensureSpace(lineHeight);
        const size = options?.size ?? 11;
        doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        for (const line of lines) {
            ensureSpace(lineHeight);
            doc.text(line, margin, cursorY);
            cursorY += lineHeight;
        }
        cursorY += options?.spacing ?? 0;
    };

    const writeKeyValue = (key: string, value: string) => {
        ensureSpace(lineHeight);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${key} :`, margin, cursorY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 130, cursorY);
        cursorY += lineHeight;
    };

    const writeSectionTitle = (title: string) => {
        cursorY += 8;
        ensureSpace(lineHeight + 8);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, cursorY);
        cursorY += 6;
        doc.setDrawColor(15, 24, 152);
        doc.setLineWidth(1);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 14;
    };

    // En-tête
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Export RGPD — Mes données', margin, cursorY);
    cursorY += 22;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Généré le ${formatDateTimeFr(data.generated_at)}`, margin, cursorY);
    cursorY += 14;
    doc.text(`Format : version ${data.format_version}`, margin, cursorY);
    cursorY += 8;
    doc.setTextColor(0);

    // Profil
    writeSectionTitle('Profil');
    const p = data.profile;
    writeKeyValue('Nom complet', `${p.first_name} ${p.last_name}`);
    writeKeyValue('Email', p.email);
    writeKeyValue('Identifiant', String(p.participant_id));
    writeKeyValue('Entreprise', p.company?.name ?? '–');
    writeKeyValue('Organisation', p.organisation ?? '–');
    writeKeyValue('Direction', p.direction ?? '–');
    writeKeyValue('Service', p.service ?? '–');
    writeKeyValue(
        'Niveau de fonction',
        p.function_level === null ? '–' : (FUNCTION_LEVEL_FR[p.function_level] ?? p.function_level)
    );

    // Campagnes
    writeSectionTitle(`Campagnes (${data.campaigns.length})`);
    if (data.campaigns.length === 0) {
        writeLine('Aucune campagne rattachée.', { size: 10 });
    } else {
        for (const c of data.campaigns) {
            writeLine(c.campaign_name ?? `Campagne #${c.campaign_id ?? '–'}`, { bold: true, size: 11 });
            writeKeyValue('Questionnaire', c.questionnaire_id);
            writeKeyValue('Invité·e le', formatDateFr(c.invited_at));
            writeKeyValue('A rejoint le', formatDateFr(c.joined_at));
            cursorY += 4;
        }
    }

    // Réponses
    writeSectionTitle(`Réponses (${data.responses.length})`);
    if (data.responses.length === 0) {
        writeLine('Aucune réponse enregistrée.', { size: 10 });
    } else {
        for (const r of data.responses) {
            const kindFr = SUBMISSION_KIND_FR[r.submission_kind] ?? r.submission_kind;
            writeLine(`#${r.response_id} — ${kindFr} (${r.questionnaire_id})`, { bold: true, size: 11 });
            writeKeyValue('Rôle', ROLE_FR[r.role] ?? r.role);
            writeKeyValue('Soumise le', formatDateTimeFr(r.submitted_at));
            writeKeyValue('Campagne', r.campaign_id === null ? '–' : `#${r.campaign_id}`);
            writeKeyValue('Nom au moment de la soumission', r.name_at_submission);
            writeKeyValue('Email au moment de la soumission', r.email_at_submission);
            writeKeyValue('Organisation', r.organisation_at_submission ?? '–');
            cursorY += 4;
        }
    }

    // Pied
    cursorY += 12;
    ensureSpace(lineHeight * 3);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
        'Ce document constitue l’export de vos données personnelles au sens des articles 15 et 20 du RGPD.',
        margin,
        cursorY
    );
    cursorY += 12;
    doc.text(
        'Pour toute question, contactez le délégué à la protection des données indiqué dans la politique de confidentialité.',
        margin,
        cursorY
    );

    doc.save(buildExportFilename(data, 'pdf'));
}

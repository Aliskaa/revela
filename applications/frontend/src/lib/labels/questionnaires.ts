/**
 * Libellés affichables des questionnaires Révéla. La table de référence est partagée par toutes
 * les vues admin / coach (liste de campagnes, détail campagne, mobile cards). Centraliser ici
 * évite que chaque route redéfinisse son propre `Record<string, string>` qui finit par diverger.
 */
export const QUESTIONNAIRE_LABELS: Record<string, string> = {
    B: 'B — Comportement',
    F: 'F — Ressentis',
    S: 'S — Soi',
};

export function questionnaireLabel(id: string | null | undefined): string {
    if (id === null || id === undefined || id === '') return '–';
    return QUESTIONNAIRE_LABELS[id] ?? id;
}

// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { IntermediateObject } from '@aor/ai-harness';

/**
 * Construit le prompt utilisateur §8 du PDF Marius. Contient uniquement
 * l'objet intermédiaire §6 sérialisé + les contraintes spécifiques de
 * cette génération précise.
 *
 * Le prompt SYSTÈME (§7) reste stable d'un appel à l'autre — il vit
 * dans `ai_prompt_versions.system_prompt`. Cette fonction ne le touche
 * jamais (séparation §7 / §8).
 *
 * V1 (décision Laurent 2026-05-10) : le retour IA porte uniquement sur
 * les données scientifiques (Élément B). La transparence et les feedbacks
 * pairs (regard sur soi) ne sont PAS commentés. Le bloc transparence est
 * donc volontairement omis du prompt, et une instruction explicite
 * interdit au LLM d'en parler — sinon il risque de produire un
 * commentaire transparence avec des mots ambigus (« ouverture sélective »,
 * « inclusion », etc.) qui font ensuite échouer le validateur §9 sur
 * `unauthorized_dimension`.
 *
 * Cas « aucune dimension candidate » (§4 PDF) : tous les écarts sont sous
 * le seuil. Le prompt instruit alors le LLM à produire une restitution
 * prudente sur l'équilibre apparent SANS citer les noms des dimensions
 * FIRO (« inclusion », « contrôle », « affection », « ouverture »).
 */
export const buildUserPrompt = (intermediate: IntermediateObject): string => {
    const selectedDimensionsJson = JSON.stringify({ selected_dimensions: intermediate.selected_dimensions }, null, 2);
    const hasDimensions = intermediate.selected_dimensions.length > 0;

    const lines: string[] = [
        'À partir des données structurées ci-dessous, rédige la restitution courte demandée par le prompt système.',
        '',
        'Données à commenter :',
        selectedDimensionsJson,
        '',
        'Contraintes spécifiques :',
        '- Ne commente aucune dimension absente des données fournies.',
        '- Ne propose pas plus de 5 questions finales.',
        '- Ne fais aucune recommandation comportementale directive.',
        '- Ne transforme pas les hypothèses en conclusions.',
        // V1 : on n'expose pas le score de transparence et on interdit explicitement
        // au modèle d'en parler — voir JSDoc.
        '- Ne commente PAS le score de transparence. Cette dimension est volontairement hors scope dans cette version.',
    ];

    if (!hasDimensions) {
        lines.push(
            '- Aucune dimension comportementale ne dépasse le seuil de signalement (§4 du cadre). Produis une restitution prudente centrée sur l\'équilibre apparent, à explorer en accompagnement. N\'emploie JAMAIS les mots « inclusion », « contrôle », « affection », « ouverture » dans ta réponse — ils sont réservés aux dimensions explicitement listées dans `selected_dimensions` ci-dessus (ici vide).'
        );
    } else {
        lines.push(
            "- Si les tensions semblent faibles, reste prudent et souligne l'intérêt d'explorer en accompagnement."
        );
    }

    return lines.join('\n');
};

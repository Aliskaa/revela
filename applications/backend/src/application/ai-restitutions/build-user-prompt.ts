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
 */
export const buildUserPrompt = (intermediate: IntermediateObject): string => {
    const selectedDimensionsJson = JSON.stringify({ selected_dimensions: intermediate.selected_dimensions }, null, 2);
    const transparencyJson = JSON.stringify({ transparency: intermediate.transparency }, null, 2);

    return [
        'À partir des données structurées ci-dessous, rédige la restitution courte demandée par le prompt système.',
        '',
        'Données à commenter :',
        selectedDimensionsJson,
        '',
        'Transparence :',
        transparencyJson,
        '',
        'Contraintes spécifiques :',
        '- Ne commente aucune dimension absente des données fournies.',
        '- Ne propose pas plus de 5 questions finales.',
        '- Ne fais aucune recommandation comportementale directive.',
        '- Ne transforme pas les hypothèses en conclusions.',
        "- Si les tensions semblent faibles, reste prudent et souligne l'intérêt d'explorer en accompagnement.",
    ].join('\n');
};

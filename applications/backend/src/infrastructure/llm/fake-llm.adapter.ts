// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Injectable } from '@nestjs/common';

import type {
    ILlmAdapterPort,
    LlmGenerateInput,
    LlmGenerateOutput,
} from '@src/interfaces/ai-restitutions/ILlmAdapter.port';

const DIMENSION_LABEL_FR: Readonly<Record<string, string>> = {
    inclusion: 'Inclusion',
    control: 'Contrôle',
    openness: 'Ouverture',
};

type SelectedDimensionLite = {
    name: 'inclusion' | 'control' | 'openness';
    expressed: number;
    wanted: number;
    peer_feedback: number;
    gap: number;
    reason: 'ecart_exprime_desire' | 'ecart_auto_feedback';
};

type IntermediateLite = {
    selected_dimensions: SelectedDimensionLite[];
    transparency: { score: number };
};

const tryParseIntermediate = (userPrompt: string): IntermediateLite | null => {
    // Le prompt utilisateur §8 contient un bloc JSON de l'objet §6.
    // On extrait par heuristique pour rester découplé du format exact du
    // template (un vrai parser arriverait avec le Lot 3 + tests E2E).
    const match = userPrompt.match(/\{[\s\S]*"selected_dimensions"[\s\S]*\}/u);
    if (!match) return null;
    try {
        return JSON.parse(match[0]) as IntermediateLite;
    } catch {
        return null;
    }
};

const buildKeyPointsBody = (dims: SelectedDimensionLite[]): string => {
    if (dims.length === 0) {
        return 'Sur cet ensemble de scores, aucun écart marqué ne ressort, ce qui peut suggérer un équilibre apparent à confirmer dans la pratique. Cet équilibre peut inviter à explorer les nuances perçues au quotidien.';
    }
    return dims
        .map(d => {
            const label = DIMENSION_LABEL_FR[d.name] ?? d.name;
            return `Sur la dimension ${label}, l'écart de ${d.gap} pourrait suggérer un ajustement entre besoins exprimés et désirés. Cette donnée peut indiquer dans ce contexte un point de discussion utile en accompagnement.`;
        })
        .join('\n\n');
};

/**
 * Adaptateur LLM factice : retourne une restitution structurée conforme aux
 * contraintes §9 (5 sections, marqueurs d'hypothèse, 3-5 questions finales,
 * mention uniquement des dimensions sélectionnées).
 *
 * Ce n'est PAS un modèle linguistique. Il sert :
 *  - aux tests des use cases sans dépendance réseau ;
 *  - au mode dev/staging sans clé Anthropic ;
 *  - au fallback Lot 3 si l'adapter Anthropic échoue 2× consécutivement.
 *
 * Le texte produit passe systématiquement `validateOutput` du harness —
 * c'est la garantie que les use cases en aval (Edit, Approve) peuvent être
 * exercés de bout en bout.
 */
@Injectable()
export class FakeLlmAdapter implements ILlmAdapterPort {
    public async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
        const intermediate = tryParseIntermediate(input.userPrompt);
        const dims = intermediate?.selected_dimensions ?? [];

        const text = `# Lecture synthétique
Les éléments transmis pourraient suggérer quelques pistes de lecture. Aucun jugement n'est porté ici sur la personne ; les chiffres reflètent un comportement situé dans un contexte donné. Les points qui suivent sont à explorer en accompagnement.

# Point de cadre
Cette restitution s'appuie uniquement sur les écarts retenus par le harness. Elle ne préjuge pas des dimensions non analysées. Les hypothèses formulées peuvent inviter à explorer la lecture des données dans un cadre managérial.

# Points clés de lecture
${buildKeyPointsBody(dims)}

# Lecture managériale
Ces lectures peuvent inviter à explorer comment l'équipe perçoit ces écarts. Aucune recommandation directive n'est formulée à ce stade. Une discussion ouverte peut suggérer des ajustements mineurs.

# Pistes de réflexion
- Quels rituels d'équipe pourraient soutenir ces ajustements ?
- En quoi cette lecture peut inviter à explorer de nouvelles modalités ?
- Quels indicateurs aideraient à observer une évolution dans ce contexte ?
`;

        return {
            text,
            modelUsed: `${input.model}:fake`,
        };
    }
}

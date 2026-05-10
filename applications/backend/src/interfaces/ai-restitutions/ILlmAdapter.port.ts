// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const LLM_ADAPTER_PORT_SYMBOL = Symbol('LLM_ADAPTER_PORT_SYMBOL');

export type LlmGenerateInput = {
    /** Prompt système §7 — règles non négociables, immuable d'un appel à l'autre. */
    systemPrompt: string;
    /** Prompt utilisateur §8 — produit par le harness, contient l'objet §6 sérialisé. */
    userPrompt: string;
    /** Plafond de tokens de sortie (≈ 1.5 × max_words). */
    maxTokens: number;
    /** Identifiant du modèle (`claude-opus-4-7`, `claude-sonnet-4-6`, …). */
    model: string;
};

export type LlmGenerateOutput = {
    text: string;
    /** Modèle effectivement utilisé (peut différer si fallback). */
    modelUsed: string;
};

/**
 * Port adaptateur LLM. Une seule responsabilité : appeler le modèle et
 * renvoyer du texte. AUCUNE logique métier (sélection dimensions, validation,
 * régénération) ici — tout cela vit côté harness `@aor/ai-harness` ou côté
 * use case.
 *
 * Implémentations prévues :
 *  - `FakeLlmAdapter` : retourne un texte conforme aux contraintes §9.
 *    Utilisé en dev/staging et dans les tests. Pas d'appel réseau.
 *  - `AnthropicLlmAdapter` (Lot 3) : appelle l'API Anthropic. Clé en
 *    variable d'env `ANTHROPIC_API_KEY` (puis Secrets Manager à terme).
 */
export interface ILlmAdapterPort {
    generate(input: LlmGenerateInput): Promise<LlmGenerateOutput>;
}

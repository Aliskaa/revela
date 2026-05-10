// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ILlmAdapterPort } from '@src/interfaces/ai-restitutions/ILlmAdapter.port';

export const LLM_ADAPTER_REGISTRY_SYMBOL = Symbol('LLM_ADAPTER_REGISTRY_SYMBOL');

/**
 * Registry mappant `provider` (col. `ai_prompt_versions.provider`) à l'adapter
 * LLM correspondant. Permet de basculer Anthropic → Fake → autre depuis
 * Settings Admin sans toucher au code (cf. décision Laurent 2026-05-10 :
 * tout paramètre métier en BDD, pas en `.env`).
 *
 * Le registry est la SEULE pièce qui connaît la liste des adapters disponibles.
 * Le use case `GenerateAiRestitutionUseCase` ne dépend que de cette interface
 * + `ILlmAdapterPort` — il ignore qu'il existe plusieurs implémentations.
 */
export interface ILlmAdapterRegistry {
    /**
     * Retourne l'adapter associé au `provider`. Lève si inconnu — le use case
     * convertit en erreur opérationnelle (les mauvaises configurations BDD ne
     * doivent pas affecter le participant en silence).
     */
    get(provider: string): ILlmAdapterPort;

    /** Liste des providers connus — utile pour la future UI Settings Admin. */
    available(): ReadonlyArray<string>;
}

export class LlmAdapterRegistry implements ILlmAdapterRegistry {
    private readonly adapters: ReadonlyMap<string, ILlmAdapterPort>;

    public constructor(entries: ReadonlyArray<readonly [string, ILlmAdapterPort]>) {
        this.adapters = new Map(entries);
    }

    public get(provider: string): ILlmAdapterPort {
        const adapter = this.adapters.get(provider);
        if (!adapter) {
            const known = [...this.adapters.keys()].join(', ');
            throw new Error(
                `Provider LLM inconnu : "${provider}". Providers disponibles : ${known}. À corriger dans Settings Admin (table ai_prompt_versions, colonne provider).`
            );
        }
        return adapter;
    }

    public available(): ReadonlyArray<string> {
        return [...this.adapters.keys()];
    }
}

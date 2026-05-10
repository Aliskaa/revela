// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import Anthropic from '@anthropic-ai/sdk';
import { Inject, Injectable } from '@nestjs/common';

import type {
    ILlmAdapterPort,
    LlmGenerateInput,
    LlmGenerateOutput,
} from '@src/interfaces/ai-restitutions/ILlmAdapter.port';

export const ANTHROPIC_API_KEY_PORT_SYMBOL = Symbol('ANTHROPIC_API_KEY_PORT_SYMBOL');

export type AnthropicApiKeyPort = { readonly apiKey: string };

/**
 * Adaptateur Anthropic pour la restitution IA Révéla.
 *
 * Appelle l'API `messages.create` avec :
 *  - `system`   = prompt §7 (immuable, vient de `ai_prompt_versions`).
 *  - `messages` = un seul tour utilisateur contenant le prompt §8 généré
 *    par le harness (objet §6 sérialisé + contraintes spécifiques).
 *
 * La clé API vit dans `.env` (puis AWS Secrets Manager) — c'est un secret,
 * il reste hors BDD. Le **modèle** par contre vient de la version de prompt
 * active (`promptVersion.model`) — paramètre métier piloté depuis Settings
 * Admin (cf. décision Laurent 2026-05-10).
 *
 * En cas d'erreur API (rate limit, panne réseau, content filter), l'exception
 * remonte au `GenerateAiRestitutionUseCase` qui décide selon la stratégie §10
 * (régénération, fallback, abandon).
 */
@Injectable()
export class AnthropicLlmAdapter implements ILlmAdapterPort {
    private readonly client: Anthropic;

    public constructor(@Inject(ANTHROPIC_API_KEY_PORT_SYMBOL) config: AnthropicApiKeyPort) {
        this.client = new Anthropic({ apiKey: config.apiKey });
    }

    public async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
        const message = await this.client.messages.create({
            model: input.model,
            max_tokens: input.maxTokens,
            system: input.systemPrompt,
            messages: [{ role: 'user', content: input.userPrompt }],
        });

        const text = message.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('\n')
            .trim();

        if (text.length === 0) {
            throw new Error(
                `Anthropic a renvoyé une réponse sans bloc de texte (model=${input.model}, stop_reason=${message.stop_reason}).`
            );
        }

        return {
            text,
            modelUsed: message.model,
        };
    }
}

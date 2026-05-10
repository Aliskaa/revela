// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { AiRestitutionStatus, AiRestitutionValidationReport } from '@aor/types';

export const AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL = Symbol('AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL');

/**
 * Snapshot d'une version de prompt système §7. La version active à un instant
 * donné détermine les règles non négociables injectées dans chaque appel LLM.
 *
 * `provider` et `model` sont des **paramètres métier** pilotés depuis l'UI
 * Settings Admin (décision Laurent 2026-05-10). Pas de variable d'env.
 *  - `provider` : clé de l'adapter LLM côté backend (`anthropic`, `fake`, …).
 *  - `model`    : identifiant modèle passé à l'adapter (`claude-opus-4-7`, …).
 */
export type AiPromptVersionRecord = {
    id: number;
    version: string;
    systemPrompt: string;
    forbiddenPhrases: string[];
    hypothesisMarkers: string[];
    maxWords: number;
    provider: string;
    model: string;
    isActive: boolean;
    createdAt: Date;
};

/**
 * Vue domaine d'une restitution IA — lue/écrite par les use cases.
 * `intermediateJson` est typé `unknown` ici : la forme exacte est validée
 * par `intermediateObjectSchema` de `@aor/ai-harness` au moment où on en a
 * besoin (pas à chaque lecture, qui est massive et coûteuse à valider).
 */
export type AiRestitutionRecord = {
    id: number;
    participantId: number;
    campaignId: number;
    status: AiRestitutionStatus;
    model: string;
    promptVersion: string;
    promptVersionId: number;
    intermediateJson: unknown;
    rawOutput: string;
    editedOutput: string | null;
    validationReport: AiRestitutionValidationReport | null;
    regenAttempts: number;
    generatedAt: Date;
    approvedAt: Date | null;
    approvedByCoachId: number | null;
    updatedAt: Date;
};

export type CreateAiRestitutionInput = {
    participantId: number;
    campaignId: number;
    status: AiRestitutionStatus;
    model: string;
    promptVersionId: number;
    intermediateJson: unknown;
    rawOutput: string;
    validationReport: AiRestitutionValidationReport | null;
};

export type UpdateAiRestitutionInput = {
    id: number;
    status?: AiRestitutionStatus;
    editedOutput?: string | null;
    validationReport?: AiRestitutionValidationReport | null;
    regenAttempts?: number;
    approvedAt?: Date | null;
    approvedByCoachId?: number | null;
};

export interface IAiRestitutionsRepositoryPort {
    findByParticipantCampaign(participantId: number, campaignId: number): Promise<AiRestitutionRecord | null>;

    findById(id: number): Promise<AiRestitutionRecord | null>;

    create(input: CreateAiRestitutionInput): Promise<AiRestitutionRecord>;

    update(input: UpdateAiRestitutionInput): Promise<AiRestitutionRecord>;

    /**
     * Renvoie la version active du prompt système. Une seule ligne doit
     * être marquée `is_active=true` à un instant T (garde-fou de cohérence
     * applicatif — la table autorise plusieurs ligne actives, mais on
     * impose un singleton via le seed).
     *
     * `null` si aucune version n'est seedée — situation anormale, le use
     * case `Generate` doit la convertir en erreur claire.
     */
    findActivePromptVersion(): Promise<AiPromptVersionRecord | null>;
}

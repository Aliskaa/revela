// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    type HarnessInput,
    type IntermediateObject,
    type ValidationFailure,
    type ValidationResult,
    buildIntermediateObject,
    selectDimensions,
    validateOutput,
} from '@aor/ai-harness';
import type { AiRestitutionValidationFailure, AiRestitutionValidationReport } from '@aor/types';

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { ILlmAdapterRegistry } from '@src/infrastructure/llm/llm-adapter-registry';
import type {
    AiPromptVersionRecord,
    AiRestitutionRecord,
    IAiRestitutionsRepositoryPort,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

import { AiRestitutionPromptNotConfiguredError } from './ai-restitution.errors';
import { buildUserPrompt } from './build-user-prompt';

const DEFAULT_MAX_TOKENS = 1500;

/** Provider de fallback §10 — toujours conforme par construction. */
const FALLBACK_PROVIDER = 'fake';

const toReportFailures = (
    failures: ReadonlyArray<{ code: string; detail: string }>
): AiRestitutionValidationFailure[] =>
    failures.map(f => ({
        code: f.code as AiRestitutionValidationFailure['code'],
        detail: f.detail,
    }));

/**
 * Construit un addendum d'instructions correctives à partir des échecs §9.
 * Ciblé selon les codes : on ne re-balance pas tout le prompt système, on
 * pointe précisément ce qui doit être corrigé. Cf. §10 PDF Marius :
 *  - Échec mineur (texte trop long)         → demande de raccourcissement.
 *  - Formulation interdite                  → rappel explicite des interdits.
 *  - Dimension non autorisée commentée      → réinjecter les dimensions autorisées.
 */
const buildCorrectiveInstruction = (
    failures: ReadonlyArray<ValidationFailure>,
    intermediate: IntermediateObject
): string => {
    const lines: string[] = [
        '',
        '⚠️ Cette restitution échoue au validateur §9. Régénère-la en corrigeant impérativement les points suivants :',
    ];

    const codes = new Set(failures.map(f => f.code));

    if (codes.has('length_exceeded')) {
        lines.push(
            `- LONGUEUR : ne dépasse jamais ${intermediate.style_constraints.max_words} mots. Sois plus concis.`
        );
    }
    if (codes.has('forbidden_phrase')) {
        const list = intermediate.style_constraints.forbidden_phrases.map(p => `« ${p} »`).join(', ');
        lines.push(`- FORMULATIONS INTERDITES : n'emploie JAMAIS ${list}.`);
    }
    if (codes.has('missing_hypothesis_markers')) {
        const list = intermediate.style_constraints.required_hypothesis_markers.map(m => `« ${m} »`).join(', ');
        lines.push(`- TON HYPOTHÉTIQUE : utilise au moins une formulation prudente parmi : ${list}.`);
    }
    if (codes.has('unauthorized_dimension')) {
        const allowed = intermediate.selected_dimensions.map(d => d.name).join(', ');
        lines.push(
            `- DIMENSIONS AUTORISÉES : commente uniquement ${allowed || "(aucune — restitution prudente sur l'équilibre apparent)"}. Aucune autre.`
        );
    }
    if (codes.has('missing_section')) {
        lines.push(
            '- STRUCTURE : inclus impérativement les 5 sections nommées : « Lecture synthétique », « Point de cadre », « Points clés de lecture », « Lecture managériale », « Pistes de réflexion ».'
        );
    }
    if (codes.has('wrong_question_count')) {
        lines.push(
            '- QUESTIONS FINALES : la dernière section doit contenir entre 3 et 5 questions ouvertes (terminées par « ? »). Pas plus, pas moins.'
        );
    }

    return lines.join('\n');
};

const callOnce = async (params: {
    registry: ILlmAdapterRegistry;
    promptVersion: AiPromptVersionRecord;
    provider: string;
    userPrompt: string;
}): Promise<{ text: string; modelUsed: string }> => {
    const adapter = params.registry.get(params.provider);
    return adapter.generate({
        systemPrompt: params.promptVersion.systemPrompt,
        userPrompt: params.userPrompt,
        maxTokens: DEFAULT_MAX_TOKENS,
        model: params.promptVersion.model,
    });
};

/**
 * Génère une restitution IA. Pipeline §3 + stratégie §10 :
 *
 * 1. Vérifier l'accès campagne (scope=coach).
 * 2. Sélectionner les dimensions (§4) + bâtir l'intermediate (§6).
 * 3. Tentative 1 (provider/model = `promptVersion.provider/model`).
 *    - Si validateur §9 OK → persist `status=generated`, `regenAttempts=0`.
 *    - Sinon, instructions correctives ciblées et tentative 2 même provider.
 * 4. Tentative 2 — si OK → persist (`regenAttempts=1`).
 * 5. Tentative 3 — bascule sur `fake` (fallback toujours conforme). Si OK
 *    → persist (`regenAttempts=2`). Sinon (cas impossible mais filet de
 *    sécurité) → persist `status=rejected` avec rapport.
 *
 * Le compteur `regenAttempts` reflète exactement le nombre de ré-essais
 * effectués (0 = succès au premier coup, 2 = il a fallu basculer en fallback).
 */
export class GenerateAiRestitutionUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly restitutions: IAiRestitutionsRepositoryPort;
            readonly llmRegistry: ILlmAdapterRegistry;
        }
    ) {}

    public async execute(params: {
        campaignId: number;
        participantId: number;
        coachId?: number;
        harnessInput: HarnessInput;
    }): Promise<AiRestitutionRecord> {
        const campaign = await this.ports.campaigns.findById(params.campaignId, {
            coachId: params.coachId,
        });
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }

        const promptVersion = await this.ports.restitutions.findActivePromptVersion();
        if (!promptVersion) {
            throw new AiRestitutionPromptNotConfiguredError();
        }

        const selected = selectDimensions(params.harnessInput);
        const intermediate = buildIntermediateObject(params.harnessInput, selected);
        const baseUserPrompt = buildUserPrompt(intermediate);

        // ── Tentative 1 : provider/model configurés en BDD ──────────────────
        const attempt1 = await callOnce({
            registry: this.ports.llmRegistry,
            promptVersion,
            provider: promptVersion.provider,
            userPrompt: baseUserPrompt,
        });
        const validation1 = validateOutput(attempt1.text, intermediate);
        if (validation1.ok) {
            return this.persist({
                params,
                promptVersion,
                intermediate,
                text: attempt1.text,
                modelUsed: attempt1.modelUsed,
                validation: validation1,
                regenAttempts: 0,
            });
        }

        // ── Tentative 2 : même provider, prompt enrichi d'instructions §10 ──
        const correctedPrompt2 = baseUserPrompt + buildCorrectiveInstruction(validation1.failures, intermediate);
        const attempt2 = await callOnce({
            registry: this.ports.llmRegistry,
            promptVersion,
            provider: promptVersion.provider,
            userPrompt: correctedPrompt2,
        });
        const validation2 = validateOutput(attempt2.text, intermediate);
        if (validation2.ok) {
            return this.persist({
                params,
                promptVersion,
                intermediate,
                text: attempt2.text,
                modelUsed: attempt2.modelUsed,
                validation: validation2,
                regenAttempts: 1,
            });
        }

        // ── Tentative 3 : fallback `fake` (§10 « basculer vers un modèle alternatif ») ──
        const attempt3 = await callOnce({
            registry: this.ports.llmRegistry,
            promptVersion,
            provider: FALLBACK_PROVIDER,
            userPrompt: correctedPrompt2,
        });
        const validation3 = validateOutput(attempt3.text, intermediate);

        return this.persist({
            params,
            promptVersion,
            intermediate,
            text: attempt3.text,
            modelUsed: attempt3.modelUsed,
            validation: validation3,
            regenAttempts: 2,
        });
    }

    private async persist(args: {
        params: {
            campaignId: number;
            participantId: number;
        };
        promptVersion: AiPromptVersionRecord;
        intermediate: IntermediateObject;
        text: string;
        modelUsed: string;
        validation: ValidationResult;
        regenAttempts: number;
    }): Promise<AiRestitutionRecord> {
        const report: AiRestitutionValidationReport = {
            ok: args.validation.ok,
            word_count: args.validation.wordCount,
            failures: toReportFailures(args.validation.failures),
            validated_at: new Date().toISOString(),
        };

        const created = await this.ports.restitutions.create({
            participantId: args.params.participantId,
            campaignId: args.params.campaignId,
            status: args.validation.ok ? 'generated' : 'rejected',
            model: args.modelUsed,
            promptVersionId: args.promptVersion.id,
            intermediateJson: args.intermediate,
            rawOutput: args.text,
            validationReport: report,
        });

        // `create` est un upsert qui réinitialise `regenAttempts` à 0. Si on
        // a vraiment réessayé, on patch via `update` pour refléter le compteur.
        if (args.regenAttempts > 0) {
            return this.ports.restitutions.update({
                id: created.id,
                regenAttempts: args.regenAttempts,
            });
        }
        return created;
    }
}

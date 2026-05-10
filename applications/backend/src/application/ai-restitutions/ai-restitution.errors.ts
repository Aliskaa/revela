// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/**
 * Erreurs métier du module Restitution IA. Conversion HTTP gérée par le
 * filter présentation (cf. `AdminAiRestitutionsExceptionFilter`).
 */

export class AiRestitutionPromptNotConfiguredError extends Error {
    public constructor() {
        super(
            'Aucune version de prompt système active. Le seed `ai_prompt_versions` est requis avant de générer une restitution.'
        );
        this.name = 'AiRestitutionPromptNotConfiguredError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AiRestitutionNotFoundError extends Error {
    public constructor() {
        super('Restitution IA introuvable pour ce couple campagne / participant.');
        this.name = 'AiRestitutionNotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AiRestitutionNotApprovableError extends Error {
    public readonly failures: ReadonlyArray<{ code: string; detail: string }>;

    public constructor(failures: ReadonlyArray<{ code: string; detail: string }>) {
        super(
            `La restitution ne peut pas être approuvée : ${failures.length} contrôle(s) §9 en échec. Édite le texte ou régénère.`
        );
        this.name = 'AiRestitutionNotApprovableError';
        this.failures = failures;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AiRestitutionGenerationFailedError extends Error {
    public readonly failures: ReadonlyArray<{ code: string; detail: string }>;

    public constructor(failures: ReadonlyArray<{ code: string; detail: string }>) {
        super(`La sortie LLM n'a pas passé le validateur §9. ${failures.length} échec(s). Voir le rapport détaillé.`);
        this.name = 'AiRestitutionGenerationFailedError';
        this.failures = failures;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

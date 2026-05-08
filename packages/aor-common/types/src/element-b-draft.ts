import { z } from 'zod';

import { answerSeriesSchema } from './questionnaire-submit';

/**
 * Body PUT brouillon Élément Humain. Une série au moins doit être fournie ;
 * `null` sur une série signale « pas encore saisie ». Le serveur écrase la
 * valeur précédente pour la(les) série(s) fournie(s) et conserve l'autre.
 */
export const upsertElementBDraftBodySchema = z
    .object({
        series0: answerSeriesSchema.nullable().optional(),
        series1: answerSeriesSchema.nullable().optional(),
    })
    .refine(b => b.series0 !== undefined || b.series1 !== undefined, {
        message: 'Au moins une série doit être fournie.',
    });

export type UpsertElementBDraftBody = z.infer<typeof upsertElementBDraftBodySchema>;

export const elementBDraftSchema = z.object({
    questionnaire_id: z.string(),
    series0: answerSeriesSchema.nullable(),
    series1: answerSeriesSchema.nullable(),
    last_saved_at: z.string(),
});

export type ElementBDraft = z.infer<typeof elementBDraftSchema>;

/** GET réponse : `null` quand aucun brouillon n'existe encore. */
export type ElementBDraftEnvelope = { draft: ElementBDraft | null };

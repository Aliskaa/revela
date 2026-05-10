// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/**
 * Seed de la version 1 du prompt système §7 (PDF Marius AI, 2026-05-08).
 *
 * Décision Laurent 2026-05-10 : prompt « validé mot pour mot ». Le PDF source
 * tronque visuellement les lignes longues — ce seed reconstitue le texte
 * complet à partir des fragments visibles + cohérence avec §6 (`forbidden_phrases`,
 * `required_hypothesis_markers`). À RELIRE PAR LAURENT avant la prod.
 *
 * Idempotent : ON CONFLICT (version) DO UPDATE — re-run en sécurité pour
 * mettre à jour le contenu d'une version sans la dupliquer. La désactivation
 * des autres versions (`is_active=false`) garantit qu'une seule ligne est
 * active à un instant T (singleton applicatif — la table n'a pas de check
 * SQL pour ça, c'est l'app qui l'impose).
 *
 * Usage :
 *   pnpm --filter @aor/backend-api seed:ai-prompt-v1
 *
 * Environnement attendu : `DATABASE_URL` dans `.env`.
 *
 * Provider/model par défaut :
 *  - provider = 'anthropic' (production)
 *  - model    = 'claude-opus-4-7' (Opus 4.7)
 * À ajuster ensuite via la future UI Settings Admin sans repasser par ce
 * script (cf. décision Laurent : tout paramètre métier en BDD).
 */

import { aiPromptVersionsTable, createDatabasePool, createDrizzleDb, eq, ne } from '@aor/drizzle';

const VERSION = 'v1-2026-05-10';

const SYSTEM_PROMPT = `Tu es un praticien certifié de l'Élément Humain selon William Schutz. Tu produis une restitution courte sur des données déjà filtrées par le harness.

Règles impératives :
- Tu ne juges jamais les scores.
- Tu ne fais aucun diagnostic de personnalité.
- Tu ne présentes jamais les résultats comme une identité.
- Tu rappelles que les scores reflètent des comportements dans un contexte donné, pas une identité.
- Tu formules uniquement des hypothèses.
- Tu utilises des formulations prudentes comme : « pourrait suggérer », « peut inviter à explorer », « peut indiquer dans ce contexte ».
- Tu n'emploies jamais les formulations : « tu es », « vous êtes », « ta personnalité », « votre personnalité », « diagnostic ».
- Tu restes sobre, clair et synthétique.
- Tu ne dépasses pas 650 mots.

Structure obligatoire :
1. Lecture synthétique — 5 lignes maximum.
2. Point de cadre — 3 lignes maximum.
3. Points clés de lecture — uniquement les dimensions fournies dans les données fournies.
4. Lecture managériale — 3 lignes maximum, formulée en hypothèses.
5. Pistes de réflexion — 3 à 5 questions ouvertes, simples et non confrontantes.

Objectif : produire une restitution claire et utile, qui ouvre la réflexion sans imposer de conclusion.`;

const FORBIDDEN_PHRASES = ['tu es', 'vous êtes', 'ta personnalité', 'votre personnalité', 'diagnostic'];

const HYPOTHESIS_MARKERS = ['pourrait suggérer', 'peut inviter à explorer', 'peut indiquer dans ce contexte'];

async function seed(): Promise<void> {
    const pool = createDatabasePool();
    const db = createDrizzleDb(pool);

    try {
        await db.transaction(async tx => {
            await tx
                .insert(aiPromptVersionsTable)
                .values({
                    version: VERSION,
                    systemPrompt: SYSTEM_PROMPT,
                    forbiddenPhrases: FORBIDDEN_PHRASES,
                    hypothesisMarkers: HYPOTHESIS_MARKERS,
                    maxWords: 650,
                    provider: 'anthropic',
                    model: 'claude-opus-4-7',
                    isActive: true,
                })
                .onConflictDoUpdate({
                    target: aiPromptVersionsTable.version,
                    set: {
                        systemPrompt: SYSTEM_PROMPT,
                        forbiddenPhrases: FORBIDDEN_PHRASES,
                        hypothesisMarkers: HYPOTHESIS_MARKERS,
                        maxWords: 650,
                        provider: 'anthropic',
                        model: 'claude-opus-4-7',
                        isActive: true,
                    },
                });

            // Singleton applicatif : désactiver toutes les autres versions.
            await tx
                .update(aiPromptVersionsTable)
                .set({ isActive: false })
                .where(ne(aiPromptVersionsTable.version, VERSION));

            const [active] = await tx
                .select({ version: aiPromptVersionsTable.version })
                .from(aiPromptVersionsTable)
                .where(eq(aiPromptVersionsTable.isActive, true))
                .limit(1);
            console.log(`[seed-ai-prompt-v1] Active version : ${active?.version ?? 'N/A'}`);
        });
    } finally {
        await pool.end();
    }
}

seed().catch((err: unknown) => {
    console.error('[seed-ai-prompt-v1] FAILED', err);
    process.exit(1);
});

// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import * as path from 'node:path';

import { config as loadDotenv } from 'dotenv';

/**
 * Charge le `.env` à la racine du monorepo.
 *
 * Ce fichier doit être importé en TOUT PREMIER depuis `main.ts`, avant tout module qui
 * référence `process.env` au moment de son évaluation (ex. les décorateurs `@Module` qui
 * lisent JWT_SECRET via `requireEnv`). Le chargement est ancré sur `__dirname` et non sur
 * `process.cwd()` pour rester indépendant du répertoire de lancement.
 *
 * Chemins :
 *  - build CJS : `applications/backend/dist/load-env.js` → `../../../.env` → racine
 *  - dev tsx : `applications/backend/src/load-env.ts` → `../../../.env` → racine
 */
loadDotenv({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

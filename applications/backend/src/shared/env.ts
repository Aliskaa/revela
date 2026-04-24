/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

/**
 * Lit une variable d'environnement obligatoire et échoue au démarrage si elle est absente ou vide.
 *
 * Motivé par la sécurité : un fallback silencieux (ex. `'dev-insecure-change-me'`) sur un
 * secret JWT permet de déployer en production avec un secret public connu. Mieux vaut
 * crasher explicitement.
 */
export const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Variable d'environnement manquante : ${name}. Définissez-la avant de démarrer l'API.`);
    }
    return value;
};

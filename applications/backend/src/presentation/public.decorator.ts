// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { SetMetadata } from '@nestjs/common';

/**
 * Clé de métadonnée marquant une route comme publique. Elle est lue par les guards
 * d'authentification JWT (ex. `ParticipantJwtAuthGuard`) pour **court-circuiter**
 * l'authentification sur les routes explicitement exemptées d'un controller par
 * ailleurs protégé au niveau classe.
 *
 * ADR-009 §2 : « le guard d'authentification est au niveau classe ; les routes
 * publiques sont l'exception **explicite**, pas l'inverse. » `@Public()` rend cette
 * exemption lisible dans le code plutôt que déduite d'un guard absent.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route comme publique : elle est exemptée du guard d'authentification
 * déclaré au niveau de la classe (login, refresh, logout d'un controller authentifié).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

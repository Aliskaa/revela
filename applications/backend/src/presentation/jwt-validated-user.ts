// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/**
 * Forme du `req.user` après passage du `JwtStrategy` Passport.
 *
 * Type partagé entre les guards et controllers de tous les espaces (admin, coach,
 * participant). Vit ici, à la racine de `presentation/`, pour éviter qu'un module
 * (admin ou participant-session) n'en soit propriétaire et que les autres aient
 * à importer dans son namespace.
 */
export type JwtValidatedUser = {
    username: string;
    role: 'admin' | 'participant';
    scope?: 'super-admin' | 'coach';
    coachId?: number;
    participantId?: number;
};

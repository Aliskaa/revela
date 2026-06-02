// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export class ParticipantAvatarFileRequiredError extends Error {
    public constructor() {
        super('Aucun fichier image fourni.');
        this.name = 'ParticipantAvatarFileRequiredError';
    }
}

export class ParticipantAvatarFileTooLargeError extends Error {
    public constructor() {
        super("L'image dépasse la taille maximale autorisée (2 Mo).");
        this.name = 'ParticipantAvatarFileTooLargeError';
    }
}

export class ParticipantAvatarFileTypeError extends Error {
    public constructor() {
        super('Format non supporté. Utilisez une image JPEG, PNG ou WebP.');
        this.name = 'ParticipantAvatarFileTypeError';
    }
}

export class ParticipantAvatarNotFoundError extends Error {
    public constructor() {
        super('Aucun avatar enregistré.');
        this.name = 'ParticipantAvatarNotFoundError';
    }
}

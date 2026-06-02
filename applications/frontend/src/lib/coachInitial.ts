/** Première lettre du nom affiché d'un coach, pour les avatars initiales des listes. */
export function coachInitial(displayName: string): string {
    const trimmed = displayName.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

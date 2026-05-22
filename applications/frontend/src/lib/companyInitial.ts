/** Première lettre du nom d'entreprise, pour les avatars initiales des listes. */
export function companyInitial(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed[0].toUpperCase() : '?';
}

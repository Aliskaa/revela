/** Initiales à partir d'un prénom et d'un nom. */
export function personInitialsFromNames(firstName: string, lastName: string): string {
    const a = firstName.trim().charAt(0);
    const b = lastName.trim().charAt(0);
    return `${a}${b}`.toUpperCase() || '?';
}

/** Initiales à partir d'un libellé affiché (ex. « Jean Dupont » → « JD », « admin » → « AD »). */
export function personInitialsFromLabel(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        const first = parts[0]?.charAt(0) ?? '';
        const last = parts[parts.length - 1]?.charAt(0) ?? '';
        return `${first}${last}`.toUpperCase() || '?';
    }
    const word = parts[0] ?? '';
    return word.slice(0, 2).toUpperCase() || '?';
}

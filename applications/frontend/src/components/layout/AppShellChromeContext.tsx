// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import * as React from 'react';

export type BreadcrumbSegment = {
    label: string;
    to?: string;
};

type AppShellChromeContextValue = {
    breadcrumbs: BreadcrumbSegment[];
    setBreadcrumbs: (segments: BreadcrumbSegment[]) => void;
};

const AppShellChromeContext = React.createContext<AppShellChromeContextValue | null>(null);

export function AppShellChromeProvider({ children }: { children: React.ReactNode }) {
    const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbSegment[]>([]);
    const value = React.useMemo(() => ({ breadcrumbs, setBreadcrumbs }), [breadcrumbs]);
    return <AppShellChromeContext.Provider value={value}>{children}</AppShellChromeContext.Provider>;
}

export function useAppShellChrome() {
    const ctx = React.useContext(AppShellChromeContext);
    if (!ctx) {
        throw new Error('useAppShellChrome must be used within AppShellChromeProvider');
    }
    return ctx;
}

/** Pousse le fil d'Ariane dans la top bar (nettoyage au démontage). No-op hors provider. */
export function useBreadcrumbs(segments: BreadcrumbSegment[]) {
    const setBreadcrumbs = React.useContext(AppShellChromeContext)?.setBreadcrumbs;
    const key = segments.map(s => `${s.label}:${s.to ?? ''}`).join('|');

    React.useEffect(() => {
        if (!setBreadcrumbs) return;
        setBreadcrumbs(segments);
        return () => setBreadcrumbs([]);
    }, [key, setBreadcrumbs]);
}

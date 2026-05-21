// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import * as React from 'react';

export type HarmonizedBreadcrumbSegment = {
    label: string;
    to?: string;
};

type HarmonizedChromeContextValue = {
    breadcrumbs: HarmonizedBreadcrumbSegment[];
    setBreadcrumbs: (segments: HarmonizedBreadcrumbSegment[]) => void;
};

const HarmonizedChromeContext = React.createContext<HarmonizedChromeContextValue | null>(null);

export function HarmonizedChromeProvider({ children }: { children: React.ReactNode }) {
    const [breadcrumbs, setBreadcrumbs] = React.useState<HarmonizedBreadcrumbSegment[]>([]);
    const value = React.useMemo(() => ({ breadcrumbs, setBreadcrumbs }), [breadcrumbs]);
    return <HarmonizedChromeContext.Provider value={value}>{children}</HarmonizedChromeContext.Provider>;
}

export function useHarmonizedChrome() {
    const ctx = React.useContext(HarmonizedChromeContext);
    if (!ctx) {
        throw new Error('useHarmonizedChrome must be used within HarmonizedChromeProvider');
    }
    return ctx;
}

/** Pousse le fil d'Ariane dans la top bar harmonisée (nettoyage au démontage). */
export function useHarmonizedBreadcrumbs(segments: HarmonizedBreadcrumbSegment[]) {
    const { setBreadcrumbs } = useHarmonizedChrome();
    const key = segments.map(s => `${s.label}:${s.to ?? ''}`).join('|');

    React.useEffect(() => {
        setBreadcrumbs(segments);
        return () => setBreadcrumbs([]);
    }, [key, setBreadcrumbs]);
}

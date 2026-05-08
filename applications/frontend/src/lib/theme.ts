import { createTheme } from '@mui/material/styles';

/**
 * Triplet RGB du primary `#0F1898`. Utile pour les libs qui n'acceptent pas de couleur CSS
 * (ex. `jsPDF.setDrawColor(r, g, b)`). Pour tout usage CSS / sx, utiliser `primary.main`.
 */
export const BRAND_PRIMARY_RGB = [15, 24, 152] as const;

declare module '@mui/material/styles' {
    interface Palette {
        border: string;
        tint: {
            // Bleu primary (`#0F1898` / rgb(15,24,152)) à différentes opacités.
            primaryBg: string; // 0.08 — pastilles, chips brand
            primaryHover: string; // 0.04 — hover discret
            primaryGhost: string; // 0.02 — cellules tableau quasi-transparentes
            primaryWash: string; // 0.05 — rangées de catégorie en tableau
            primarySelected: string; // 0.06 — items de liste sélectionnés
            primaryRail: string; // 0.10 — rails de slider, hover de liste actif
            primaryActive: string; // 0.12 — item nav actif, peer card sélectionnée
            primaryHalo: string; // 0.15 — focus rings / halo de thumb
            primaryEmboss: string; // 0.18 — fond AppBar admin (Navbar legacy)
            // Jaune secondary à différentes opacités (jaune ajusté `rgb(245,196,0)`).
            secondaryBg: string; // 0.16 — chips secondary
            secondaryRail: string; // 0.20 — rails de slider "désiré"
            secondaryHalo: string; // 0.15 — halo focus jaune
            secondaryText: string;
            successBg: string;
            successText: string;
            mutedBg: string;
            mutedText: string;
            subtleBg: string;
            overlayNeutral: string; // 0.03 — hover gris-noir (listes neutres)
            overlayWhite: string; // 0.10 — voile blanc sur fonds sombres
            // Surfaces neutres : utilisées pour hover/sélection sur fond paper
            // sans connotation brand (sidebar inactive, lignes de tableau, etc.)
            neutralHover: string; // 0.04 — hover discret sur item nav inactif
            dangerHover: string; // 0.08 rouge — hover bouton déconnexion
            dangerText: string; // texte rouge bouton déconnexion
        };
        shadow: {
            brandSm: string; // logos, badges (12px)
            brandMd: string; // boutons brand (14px)
            brandWhisper: string; // hover carte discret (8px)
            brandSubtle: string; // cartes type placeholder (24px)
            brandPaper: string; // grands papers brand (40px)
            brandHero: string; // BrandMark, logo principal (25px @ 0.18)
            brandActive: string; // item nav actif (25px @ 0.16)
            brandHaloPrimary: string; // halo focus thumb bleu
            brandHaloSecondary: string; // halo focus thumb jaune
            cardSoft: string; // cartes neutres
            thumb: string; // thumbs de slider au repos
        };
    }
    interface PaletteOptions {
        border?: string;
        tint?: Partial<Palette['tint']>;
        shadow?: Partial<Palette['shadow']>;
    }
}

export const theme = createTheme({
    palette: {
        primary: {
            main: '#0F1898',
            dark: 'rgb(10,18,130)',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#FFCC00',
            contrastText: '#1a1a2e',
        },
        success: { main: '#8BD7B7' },
        info: { main: '#83D8F5' },
        warning: { main: '#D3D800' },
        error: { main: '#ef4444' },
        background: {
            default: '#f4f6fb',
            paper: '#ffffff',
        },
        text: {
            primary: '#1a1a2e',
            secondary: '#6b7280',
        },
        border: 'rgba(15,23,42,0.10)',
        tint: {
            primaryBg: 'rgba(15,24,152,0.08)',
            primaryHover: 'rgba(15,24,152,0.04)',
            primaryGhost: 'rgba(15,24,152,0.02)',
            primaryWash: 'rgba(15,24,152,0.05)',
            primarySelected: 'rgba(15,24,152,0.06)',
            primaryRail: 'rgba(15,24,152,0.10)',
            primaryActive: 'rgba(15,24,152,0.12)',
            primaryHalo: 'rgba(15,24,152,0.15)',
            primaryEmboss: 'rgba(15,24,152,0.18)',
            secondaryBg: 'rgba(255,204,0,0.16)',
            secondaryRail: 'rgba(245,196,0,0.20)',
            secondaryHalo: 'rgba(245,196,0,0.15)',
            secondaryText: 'rgb(180,120,0)',
            successBg: 'rgba(16,185,129,0.12)',
            successText: 'rgb(4,120,87)',
            mutedBg: 'rgba(148,163,184,0.16)',
            mutedText: 'rgb(100,116,139)',
            subtleBg: 'rgba(15,23,42,0.06)',
            overlayNeutral: 'rgba(0,0,0,0.03)',
            overlayWhite: 'rgba(255,255,255,0.10)',
            neutralHover: 'rgba(15,23,42,0.04)',
            dangerHover: 'rgba(239,68,68,0.08)',
            dangerText: 'rgb(220,38,38)',
        },
        shadow: {
            brandSm: '0 4px 12px rgba(15,24,152,0.25)',
            brandMd: '0 4px 14px rgba(15,24,152,0.25)',
            brandWhisper: '0 2px 8px rgba(15,24,152,0.08)',
            brandSubtle: '0 4px 24px rgba(15,24,152,0.06)',
            brandPaper: '0 12px 40px rgba(15,24,152,0.05)',
            brandHero: '0 10px 25px rgba(15,24,152,0.18)',
            brandActive: '0 10px 25px rgba(15,24,152,0.16)',
            brandHaloPrimary: '0 0 0 6px rgba(15,24,152,0.15)',
            brandHaloSecondary: '0 0 0 6px rgba(245,196,0,0.15)',
            cardSoft: '0 4px 20px rgba(0,0,0,0.03)',
            thumb: '0 2px 8px rgba(0,0,0,0.12)',
        },
    },
    typography: {
        fontFamily: '"Outfit", "Tenorite", sans-serif',
        h1: { fontWeight: 800 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    /**
     * Échelle de border-radius utilisée dans le projet (les `borderRadius: N` en sx s'expriment en
     * multiples de cette unité de base : sx `borderRadius: 3` = 3 * shape.borderRadius / 8 ≈ 4 px) :
     *  - `borderRadius: 99` (pill) : chips, boutons d'action arrondis (Résultats, Coachs…)
     *  - `borderRadius: 4`        : cartes "soft" (mini-stat, sidebar mini-cards)
     *  - `borderRadius: 3`        : cartes denses, badges arrondis discrets
     *  - `borderRadius: 2`        : très compact (peu utilisé)
     *
     * Buttons : 8 par défaut (theme), Cards : 6. Si tu hardcodes une autre valeur en sx, c'est un
     * choix design délibéré — sinon laisse le thème faire.
     */
    shape: { borderRadius: 10 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: { borderRadius: 6, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { fontWeight: 700 },
            },
        },
    },
});

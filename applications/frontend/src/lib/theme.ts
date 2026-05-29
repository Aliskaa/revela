import { createTheme } from '@mui/material/styles';

/**
 * Triplet RGB du primary `#0F1898`. Utile pour les libs qui n'acceptent pas de couleur CSS
 * (ex. `jsPDF.setDrawColor(r, g, b)`). Pour tout usage CSS / sx, utiliser `primary.main`.
 */
export const BRAND_PRIMARY_RGB = [15, 24, 152] as const;

declare module '@mui/material/styles' {
    interface Palette {
        border: string;
        /** Surfaces Stitch (lavande, outline, fonds neutres). */
        surface: {
            lavenderGrey: string;
            lavenderGreyHover: string;
            lavenderGreyFaint: string;
            outlineVariant: string;
            outlineVariantFaint: string;
            outlineVariantSoft: string;
            onSurfaceVariant: string;
            containerLow: string;
            softWhite: string;
            footerWash: string;
            azurin: string;
            listTableHead: string;
            listTableRowBorder: string;
            progressGradient: string;
            drawerWash: string; // fond drawer mobile (sidebar repliée)
            slateWash: string; // fond topbar scoped (slate translucide)
        };
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
            // Vert saturé `#10b981` pour les éléments "Analyse Scientifique"
            // (texte de cellule, badge gap, label colonne). Distinct du vert pastel
            // `success.main` utilisé pour les barres et les chips de succès.
            scientific: string;
            scientificBg: string; // rgba(16,185,129,0.02) — fond très subtle de cellule scientifique
            // Cyan saturé `#0EA5C9` pour les badges d'écart des pairs (gap pill).
            peerStrong: string;
            mutedBg: string;
            mutedText: string;
            subtleBg: string;
            subtleRow: string; // rgba(15,23,42,0.025) — fond de rangée "écart" (plus discret que subtleBg)
            overlayNeutral: string; // 0.03 — hover gris-noir (listes neutres)
            overlayWhite: string; // 0.10 — voile blanc sur fonds sombres
            // Surfaces neutres : utilisées pour hover/sélection sur fond paper
            // sans connotation brand (sidebar inactive, lignes de tableau, etc.)
            neutralHover: string; // 0.04 — hover discret sur item nav inactif
            dangerHover: string; // 0.08 rouge — hover bouton déconnexion
            dangerText: string; // texte rouge bouton déconnexion
            dangerBorder: string;
            primaryFocusRing: string;
            primarySwitchTrack: string;
            iconMuted: string;
            adminBadgeBg: string;
            adminBadgeText: string;
            adminBadgeBorder: string; // bordure ambre du bandeau super-admin
            successTextHover: string;
            onPrimaryText: string;
            onPrimaryBorder: string;
            onPrimaryBorderHover: string;
            onPrimarySurface: string;
            onPrimarySurfaceHover: string;
            onPrimarySurfaceFaint: string; // 0.05 — item nav mobile inactif
            onPrimarySurfaceStrong: string; // 0.16 — badge sur panneau brand
            onPrimaryTextMuted: string; // 0.72 — sous-titres sur fond brand
            onPrimaryTextFaint: string; // 0.6 — mentions discrètes sur fond brand
            onPrimaryIcon: string; // 0.8 — icônes sur fond brand
            onDarkMuted: string; // texte nav inactif (off-white) sur sidebar sombre
            onDarkDangerText: string; // libellé déconnexion sur sidebar sombre
            secondaryGlow: string; // 0.18 — halo jaune sur fond brand
            secondarySoft: string; // 0.14 — chip jaune doux
            iconMutedFaint: string; // 0.6 — séparateur de breadcrumb
            subtleGhost: string; // 0.02 — fond de ligne très discret
            onPrimarySheen: string;
            secondaryTextHover: string;
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
            buttonLift: string;
            buttonLiftHover: string;
            stickyAction: string;
            secondaryLift: string;
            sidebar: string; // ombre portée de la sidebar sombre
            secondaryGlowSm: string; // glow jaune (badge marque)
            navActive: string; // ombre item nav actif (rail jaune)
            topbar: string; // ombre basse de la topbar
            cardHoverLift: string; // lift au survol des cartes participant
        };
    }
    interface PaletteOptions {
        border?: string;
        surface?: Partial<Palette['surface']>;
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
        surface: {
            lavenderGrey: '#F5F5FB',
            lavenderGreyHover: 'rgba(245, 245, 251, 0.8)',
            lavenderGreyFaint: 'rgba(245, 245, 251, 0.2)',
            outlineVariant: 'rgba(198, 197, 214, 1)',
            outlineVariantFaint: 'rgba(198, 197, 214, 0.3)',
            outlineVariantSoft: 'rgba(198, 197, 214, 0.45)',
            onSurfaceVariant: '#454653',
            containerLow: '#f3f3f3',
            softWhite: '#FAFAFA',
            footerWash: 'rgba(250, 250, 250, 0.8)',
            azurin: '#4F70E5',
            listTableHead: 'rgba(79, 112, 229, 0.06)',
            listTableRowBorder: 'rgba(79, 112, 229, 0.08)',
            progressGradient: 'linear-gradient(90deg, #4F70E5 0%, #0F1898 100%)',
            drawerWash: 'rgba(250, 250, 250, 0.92)',
            slateWash: 'rgba(248, 250, 252, 0.92)',
        },
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
            scientific: '#10b981',
            scientificBg: 'rgba(16,185,129,0.02)',
            peerStrong: '#0EA5C9',
            mutedBg: 'rgba(148,163,184,0.16)',
            mutedText: 'rgb(100,116,139)',
            subtleBg: 'rgba(15,23,42,0.06)',
            subtleRow: 'rgba(15,23,42,0.025)',
            overlayNeutral: 'rgba(0,0,0,0.03)',
            overlayWhite: 'rgba(255,255,255,0.10)',
            neutralHover: 'rgba(15,23,42,0.04)',
            dangerHover: 'rgba(239,68,68,0.08)',
            dangerText: 'rgb(220,38,38)',
            dangerBorder: 'rgba(239,68,68,0.3)',
            primaryFocusRing: 'rgba(15, 24, 152, 0.2)',
            primarySwitchTrack: 'rgba(15, 24, 152, 0.4)',
            iconMuted: 'rgba(107, 114, 128, 0.7)',
            adminBadgeBg: 'rgb(254,243,199)',
            adminBadgeText: 'rgb(120,53,15)',
            adminBadgeBorder: 'rgb(252,211,77)',
            successTextHover: 'rgb(3,100,70)',
            secondaryTextHover: 'rgb(150,100,0)',
            onPrimaryText: 'rgba(255,255,255,0.85)',
            onPrimaryBorder: 'rgba(255,255,255,0.25)',
            onPrimaryBorderHover: 'rgba(255,255,255,0.4)',
            onPrimarySurface: 'rgba(255,255,255,0.1)',
            onPrimarySurfaceHover: 'rgba(255,255,255,0.2)',
            onPrimarySurfaceFaint: 'rgba(255,255,255,0.05)',
            onPrimarySurfaceStrong: 'rgba(255,255,255,0.16)',
            onPrimaryTextMuted: 'rgba(255,255,255,0.72)',
            onPrimaryTextFaint: 'rgba(255,255,255,0.6)',
            onPrimaryIcon: 'rgba(255,255,255,0.8)',
            onDarkMuted: 'rgba(250,250,250,0.7)',
            onDarkDangerText: 'rgba(239,68,68,0.85)',
            secondaryGlow: 'rgba(255,204,0,0.18)',
            secondarySoft: 'rgba(255,204,0,0.14)',
            iconMutedFaint: 'rgba(107,114,128,0.6)',
            subtleGhost: 'rgba(15,23,42,0.02)',
            onPrimarySheen: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)',
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
            buttonLift: '0 10px 25px -5px rgba(15, 24, 152, 0.2)',
            buttonLiftHover: '0 14px 30px -5px rgba(15, 24, 152, 0.3)',
            stickyAction: '-8px 0 16px -8px rgba(15, 24, 152, 0.1)',
            secondaryLift: '0 8px 24px rgba(255, 204, 0, 0.25)',
            sidebar: '0 25px 50px -12px rgba(15, 24, 152, 0.25)',
            secondaryGlowSm: '0 10px 15px -3px rgba(255, 204, 0, 0.3)',
            navActive: '4px 0 12px rgba(255, 204, 0, 0.2)',
            topbar: '0 4px 6px -1px rgba(15, 24, 152, 0.05)',
            cardHoverLift: '0 6px 18px -10px rgba(15, 23, 42, 0.18)',
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

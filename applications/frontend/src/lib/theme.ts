import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        border: string;
        tint: {
            primaryBg: string;
            primaryHover: string;
            secondaryBg: string;
            secondaryText: string;
            successBg: string;
            successText: string;
            mutedBg: string;
            mutedText: string;
            subtleBg: string;
        };
    }
    interface PaletteOptions {
        border?: string;
        tint?: {
            primaryBg?: string;
            primaryHover?: string;
            secondaryBg?: string;
            secondaryText?: string;
            successBg?: string;
            successText?: string;
            mutedBg?: string;
            mutedText?: string;
            subtleBg?: string;
        };
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
            secondaryBg: 'rgba(255,204,0,0.16)',
            secondaryText: 'rgb(180,120,0)',
            successBg: 'rgba(16,185,129,0.12)',
            successText: 'rgb(4,120,87)',
            mutedBg: 'rgba(148,163,184,0.16)',
            mutedText: 'rgb(100,116,139)',
            subtleBg: 'rgba(15,23,42,0.06)',
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
    shape: { borderRadius: 10 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { 
                    textTransform: 'none', fontWeight: 600, borderRadius: 8 },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: { borderRadius: 6, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { fontWeight: 700 },
            },
        },
    },
});

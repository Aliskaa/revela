import { Box, Stack, Typography } from '@mui/material';
import { Sparkles } from 'lucide-react';
import type * as React from 'react';

export type AuthSplitLayoutProps = {
    /** Petit chip d'identification au-dessus du titre (ex. "Espace Admin"). */
    eyebrow: string;
    /** Titre principal de la page de connexion. */
    title: string;
    /** Sous-titre descriptif sous le titre. */
    subtitle: string;
    /** Phrase d'inspiration affichée sur le panneau de gauche (desktop). */
    leftQuote?: string;
    /** Auteur / source de la quote (sous le texte). */
    leftQuoteAttribution?: string;
    /** Formulaire et liens auxiliaires. */
    children: React.ReactNode;
};

/**
 * Coque pleine page pour les écrans d'authentification (login admin, login participant,
 * mot-de-passe oublié…). Split layout responsive : panneau marketing à gauche (visible
 * `lg+`), formulaire à droite, plein écran sur mobile.
 *
 * Avant cette factorisation, chaque page d'auth construisait à la main son `Paper`
 * de 400px centré sur `minHeight: 80vh` — sans illustration, sans contexte, et avec
 * un `BrandMark` réinventé inline. Cette coque centralise la chrome.
 */
export function AuthSplitLayout({
    eyebrow,
    title,
    subtitle,
    leftQuote,
    leftQuoteAttribution,
    children,
}: AuthSplitLayoutProps) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.05fr 1fr' },
                bgcolor: 'background.default',
            }}
        >
            {/* Panneau marketing — desktop uniquement */}
            <Box
                sx={{
                    display: { xs: 'none', lg: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: 6,
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Halo décoratif pour ne pas laisser un aplat brut */}
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        top: -120,
                        right: -120,
                        width: 360,
                        height: 360,
                        borderRadius: '50%',
                        bgcolor: 'tint.overlayWhite',
                        filter: 'blur(8px)',
                    }}
                />
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        bottom: -180,
                        left: -80,
                        width: 320,
                        height: 320,
                        borderRadius: '50%',
                        bgcolor: 'tint.secondaryGlow',
                        filter: 'blur(12px)',
                    }}
                />

                <Stack direction="row" spacing={1.4} alignItems="center" sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            bgcolor: 'tint.onPrimarySurfaceStrong',
                            color: 'common.white',
                            display: 'grid',
                            placeItems: 'center',
                            backdropFilter: 'blur(6px)',
                        }}
                    >
                        <Sparkles size={18} />
                    </Box>
                    <Box>
                        <Typography fontWeight={800} lineHeight={1.1}>
                            Révéla
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'tint.onPrimaryTextMuted' }}>
                            Lecture des écarts, restitution de campagne
                        </Typography>
                    </Box>
                </Stack>

                {leftQuote ? (
                    <Box sx={{ position: 'relative', maxWidth: 520 }}>
                        <Typography
                            variant="h3"
                            sx={{ fontWeight: 700, lineHeight: 1.25, letterSpacing: -0.5, color: 'common.white' }}
                        >
                            « {leftQuote} »
                        </Typography>
                        {leftQuoteAttribution ? (
                            <Typography
                                variant="body2"
                                sx={{ mt: 2.5, color: 'tint.onPrimaryTextMuted', fontWeight: 500 }}
                            >
                                — {leftQuoteAttribution}
                            </Typography>
                        ) : null}
                    </Box>
                ) : (
                    <Box />
                )}

                <Typography variant="caption" sx={{ color: 'tint.onPrimaryTextFaint', position: 'relative' }}>
                    © {new Date().getFullYear()} AOR Conseil — Plateforme Révéla
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 3, sm: 5 },
                }}
            >
                <Box sx={{ width: '100%', maxWidth: 420 }}>
                    {/* BrandMark visible sur mobile uniquement (le panneau gauche le porte sur desktop). */}
                    <Stack
                        direction="row"
                        spacing={1.4}
                        alignItems="center"
                        sx={{ display: { xs: 'flex', lg: 'none' }, mb: 4 }}
                    >
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 3,
                                bgcolor: 'primary.main',
                                color: 'common.white',
                                display: 'grid',
                                placeItems: 'center',
                                boxShadow: theme => theme.palette.shadow.brandHero,
                            }}
                        >
                            <Sparkles size={18} />
                        </Box>
                        <Box>
                            <Typography fontWeight={800} color="text.primary" lineHeight={1.1}>
                                Révéla
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {eyebrow}
                            </Typography>
                        </Box>
                    </Stack>

                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1.4,
                            py: 0.4,
                            borderRadius: 99,
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: 0.4,
                            mb: 1.5,
                        }}
                    >
                        {eyebrow}
                    </Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                        {subtitle}
                    </Typography>

                    <Box sx={{ mt: 3.5 }}>{children}</Box>
                </Box>
            </Box>
        </Box>
    );
}

import { Box, Button, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type HarmonizedAdminPageHeaderProps = {
    title: string;
    subtitle: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
};

/** En-tête admin harmonisé : titre H3 + sous-titre + CTA primaire optionnel. */
export function HarmonizedAdminPageHeader({ title, subtitle, action }: HarmonizedAdminPageHeaderProps) {
    const ActionIcon = action?.icon ?? Plus;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { md: 'flex-end' },
                justifyContent: 'space-between',
                gap: 3,
            }}
        >
            <Box>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 900,
                        letterSpacing: -0.03,
                        lineHeight: 1.1,
                        mb: 1,
                    }}
                >
                    {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.7 }}>
                    {subtitle}
                </Typography>
            </Box>
            {action ? (
                <Button
                    variant="contained"
                    disableElevation
                    startIcon={<ActionIcon size={18} />}
                    onClick={action.onClick}
                    sx={{
                        bgcolor: 'primary.main',
                        px: 4,
                        py: 1.75,
                        borderRadius: 3,
                        fontWeight: 700,
                        boxShadow: '0 10px 20px rgba(15, 24, 152, 0.2)',
                        alignSelf: { xs: 'flex-start', md: 'auto' },
                        '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'translateY(-2px)',
                            boxShadow: theme => theme.palette.shadow.brandSubtle,
                        },
                    }}
                >
                    {action.label}
                </Button>
            ) : null}
        </Box>
    );
}

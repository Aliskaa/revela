import { Box, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/common/Button';

export type AdminPageHeaderProps = {
    title: string;
    subtitle: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
};

/** En-tête de page admin harmonisé : titre H3 + sous-titre + CTA primaire optionnel. */
export function AdminPageHeader({ title, subtitle, action }: AdminPageHeaderProps) {
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
                    appearance="primary"
                    startIcon={<ActionIcon size={20} strokeWidth={2} />}
                    onClick={action.onClick}
                    sx={{
                        px: 4,
                        py: 2,
                        gap: 1,
                        alignSelf: { xs: 'flex-start', md: 'auto' },
                        flexShrink: 0,
                    }}
                >
                    {action.label}
                </Button>
            ) : null}
        </Box>
    );
}

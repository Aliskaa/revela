import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type AiPlaceholderProps = {
    title: string;
    children: ReactNode;
    fullWidth?: boolean;
};

export function AiPlaceholder({ title, children, fullWidth }: AiPlaceholderProps) {
    return (
        <Box
            sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(21, 21, 176, 0.06)', // Ombre légèrement teintée Bleu smalt
                maxWidth: fullWidth ? 'none' : 420,
            }}
        >
            <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, letterSpacing: '0.02em' }}
            >
                {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>
                {children}
            </Typography>
        </Box>
    );
}

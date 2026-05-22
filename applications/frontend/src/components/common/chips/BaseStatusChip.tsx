import { Box, Typography } from '@mui/material';

export type StatusChipTone = {
    label: string;
    bg: string;
    color: string;
    dot?: string;
    pulse?: boolean;
};

export type BaseStatusChipProps = StatusChipTone;

export function BaseStatusChip({ label, bg, color, dot, pulse = false }: BaseStatusChipProps) {
    const dotColor = dot ?? color;

    return (
        <Box
            component="span"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: 99,
                bgcolor: bg,
                color,
                fontWeight: 700,
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
            }}
        >
            <Box
                component="span"
                sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: dotColor,
                    mr: 1,
                    flexShrink: 0,
                    ...(pulse
                        ? {
                              animation: 'statusChipPulse 2s ease-in-out infinite',
                              '@keyframes statusChipPulse': {
                                  '0%, 100%': { opacity: 1 },
                                  '50%': { opacity: 0.45 },
                              },
                          }
                        : {}),
                }}
            />
            <Typography component="span" sx={{ font: 'inherit', lineHeight: 1 }}>
                {label}
            </Typography>
        </Box>
    );
}

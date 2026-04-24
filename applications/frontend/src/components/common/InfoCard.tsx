import { Box, Card, Stack, Typography } from '@mui/material';

type InfoCardProps = {
    icon: React.ElementType;
    label: string;
    value: string;
    variant?: 'outlined' | 'border';
    tint?: 'primary' | 'secondary';
};

export const InfoCard = ({ icon: Icon, label, value, variant = 'outlined', tint = 'primary' }: InfoCardProps) => {
    const iconBg = tint === 'primary' ? 'tint.primaryBg' : 'tint.secondaryBg';
    const iconColor = tint === 'primary' ? 'primary.main' : 'tint.secondaryText';

    const content = (
        <Stack direction="row" spacing={1.2} alignItems="start">
            <Box
                sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 3,
                    bgcolor: iconBg,
                    color: iconColor,
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                }}
            >
                <Icon size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    );

    if (variant === 'border') {
        return <Box sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 1.8 }}>{content}</Box>;
    }

    return (
        <Card variant="outlined" sx={{ p: 1.8 }}>
            {content}
        </Card>
    );
};

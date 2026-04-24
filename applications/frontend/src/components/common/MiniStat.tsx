import { Box, Typography } from '@mui/material';

export function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ border: '1px solid rgba(15,23,42,0.10)', borderRadius: 4, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
                {value}
            </Typography>
        </Box>
    );
}

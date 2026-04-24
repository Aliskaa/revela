import { Divider, Stack, Typography } from '@mui/material';

export function FooterLayout() {
    return (
        <>
            <Divider />
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ px: { xs: 2, md: 4 }, py: 1.5, color: 'text.secondary', bgcolor: 'background.paper' }}
            >
                <Typography variant="caption" fontWeight={500}>
                    © 2026 Révéla — AOR Conseil. Tous droits réservés.
                </Typography>
                <Typography variant="caption" fontWeight={500}>
                    v1.0.0
                </Typography>
            </Stack>
        </>
    );
}

import { Divider, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

export function FooterLayout() {
    return (
        <>
            <Divider />
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.5, sm: 2 }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ px: { xs: 2, md: 4 }, py: 1.5, color: 'text.secondary', bgcolor: 'background.paper' }}
            >
                <Typography variant="caption" fontWeight={500}>
                    © 2026 Révéla — AOR Conseil. Tous droits réservés.
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <MuiLink
                        component={Link}
                        to="/privacy"
                        underline="hover"
                        sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary' }}
                    >
                        Politique de confidentialité
                    </MuiLink>
                    <Typography variant="caption" fontWeight={500}>
                        v1.0.0
                    </Typography>
                </Stack>
            </Stack>
        </>
    );
}

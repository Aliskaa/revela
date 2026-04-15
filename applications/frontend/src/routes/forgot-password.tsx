import { Box, Button, Paper, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/forgot-password')({
    component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
    return (
        <Box
            sx={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
            }}
        >
            <Paper sx={{ p: 5, width: '100%', maxWidth: 420 }} elevation={0} variant="outlined">
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    Mot de passe oublié
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    La réinitialisation par e-mail sera disponible prochainement. En attendant, contactez
                    l’administrateur de votre campagne pour obtenir une nouvelle invitation si nécessaire.
                </Typography>
                <Button component={Link} to="/login" startIcon={<ArrowLeft size={16} />} variant="outlined">
                    Retour à la connexion
                </Button>
            </Paper>
        </Box>
    );
}

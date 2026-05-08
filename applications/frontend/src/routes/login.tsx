import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { useParticipantLogin } from '@/hooks/participantAuth';
import { userParticipant } from '@/lib/auth';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/login')({
    beforeLoad: () => {
        if (userParticipant.isAuthenticated()) {
            throw redirect({ to: '/' });
        }
    },
    component: ParticipantLoginPage,
});

function ParticipantLoginPage() {
    const navigate = useNavigate();
    const login = useParticipantLogin();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await login.mutateAsync({ email, password });
            navigate({ to: '/' });
        } catch {
            // mutation exposes isError
        }
    }

    function errorMessage(): string {
        const ax = login.error as {
            response?: { status?: number; data?: { error?: string } };
        };
        const status = ax?.response?.status;
        const apiError = ax?.response?.data?.error;
        if (status === 404) {
            return "La connexion participant n'est pas encore disponible côté serveur.";
        }
        if (status === 403 && apiError) {
            return apiError;
        }
        return 'E-mail ou mot de passe incorrect.';
    }

    return (
        <AuthSplitLayout
            eyebrow="Espace participant"
            title="Bienvenue sur Révéla"
            subtitle="Connectez-vous avec l'e-mail et le mot de passe associés à votre compte. Première visite ? Utilisez le lien reçu dans votre invitation."
            leftQuote="Voir l'écart entre la perception et la réalité, c'est s'offrir l'espace pour grandir."
            leftQuoteAttribution="Démarche Révéla"
        >
            {login.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage()}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <TextField
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        fullWidth
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        label="Mot de passe"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        fullWidth
                        autoComplete="current-password"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disableElevation
                        disabled={login.isPending}
                        startIcon={
                            login.isPending ? <CircularProgress size={16} color="inherit" /> : <LogIn size={16} />
                        }
                    >
                        {login.isPending ? 'Connexion…' : 'Se connecter'}
                    </Button>
                    <Typography variant="body2" textAlign="center" color="text.secondary">
                        <Link to="/forgot-password" style={{ color: 'inherit', fontWeight: 600 }}>
                            Mot de passe oublié ?
                        </Link>
                    </Typography>
                </Stack>
            </Box>
        </AuthSplitLayout>
    );
}

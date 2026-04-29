import { useParticipantLogin } from '@/hooks/participantAuth';
import { userParticipant } from '@/lib/auth';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
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
        <Box
            sx={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
            }}
        >
            <Paper sx={{ p: 5, width: '100%', maxWidth: 400 }} elevation={0} variant="outlined">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontWeight: 900,
                            fontSize: '1.2rem',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            letterSpacing: '0.08em',
                            mb: 2,
                        }}
                    >
                        Révéla
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                        Connexion participant
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Utilisez l’e-mail et le mot de passe associés à votre compte. Première visite ? Utilisez le lien
                        reçu dans votre invitation.
                    </Typography>
                </Box>

                {login.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage()}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        disabled={login.isPending}
                        startIcon={
                            login.isPending ? <CircularProgress size={16} color="inherit" /> : <LogIn size={16} />
                        }
                    >
                        {login.isPending ? 'Connexion…' : 'Se connecter'}
                    </Button>
                    <Typography variant="body2" textAlign="center">
                        <Link to="/forgot-password" style={{ color: 'inherit', fontWeight: 600 }}>
                            Mot de passe oublié ?
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}

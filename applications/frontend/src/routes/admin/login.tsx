import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { useAdminLogin } from '@/hooks/admin';
import { Alert, Box, Button, CircularProgress, Stack, TextField } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/admin/login')({
    component: AdminLoginPage,
});

function AdminLoginPage() {
    const navigate = useNavigate();
    const login = useAdminLogin();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const result = await login.mutateAsync({ username, password });
            // Redirige selon le scope effectif renvoyé par le backend (cf. ADR-008 + V1.5 espace coach).
            // Un super-admin atterrit sur /admin (vue globale), un coach sur /coach (périmètre filtré).
            navigate({ to: result.scope === 'coach' ? '/coach' : '/admin' });
        } catch {
            // error handled by mutation state
        }
    }

    return (
        <AuthSplitLayout
            eyebrow="Espace Admin"
            title="Connexion à la console"
            subtitle="Pilotez vos campagnes, accompagnez les coachs et suivez les participants depuis le tableau de bord."
            leftQuote="Le rôle du coach n'est pas de donner les réponses, mais d'éclairer les questions qui méritent d'être posées."
            leftQuoteAttribution="Démarche Révéla"
        >
            {login.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Identifiants incorrects.
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                    <TextField
                        label="Identifiant"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                    <TextField
                        label="Mot de passe"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        fullWidth
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
                </Stack>
            </Box>
        </AuthSplitLayout>
    );
}

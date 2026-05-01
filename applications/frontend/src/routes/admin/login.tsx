import { useAdminLogin } from '@/hooks/admin';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
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
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
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
                        Espace Admin
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Connectez-vous pour accéder au tableau de bord.
                    </Typography>
                </Box>

                {login.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Identifiants incorrects.
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        disabled={login.isPending}
                        startIcon={
                            login.isPending ? <CircularProgress size={16} color="inherit" /> : <LogIn size={16} />
                        }
                    >
                        {login.isPending ? 'Connexion…' : 'Se connecter'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

import { useCreateCoach } from '@/hooks/admin';
import { Alert, Box, Button, Divider, Drawer, Stack, TextField, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function CoachForm() {
    const createCoach = useCreateCoach();

    // États du formulaire
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');

    // États de l'interface
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleCreate = async () => {
        try {
            await createCoach.mutateAsync({
                username: username.trim(),
                displayName: displayName.trim(),
                password: password.trim(),
            });
            setUsername('');
            setDisplayName('');
            setPassword('');
            setIsDrawerOpen(false);
        } catch {
            // L’erreur est affichée via createCoach.isError
        }
    };
    return (
        <>
            <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Plus size={20} />}
                onClick={() => setIsDrawerOpen(true)}
                sx={{ boxShadow: 2 }}
            >
                Nouveau coach
            </Button>
            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 450 }, p: 0 },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            Nouveau coach
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Remplissez les informations ci-dessous pour créer un nouveau coach.
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Stack spacing={3} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                        <TextField
                            label="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Nom affiché"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Mot de passe"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            fullWidth
                        />

                        {createCoach.isError && (
                            <Alert severity="error">{createCoach.error.message || 'Erreur lors de la création.'}</Alert>
                        )}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setIsDrawerOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={createCoach.isPending || username.trim().length < 3 || !displayName || !password}
                            onClick={handleCreate}
                        >
                            {createCoach.isPending ? 'Création...' : 'Créer le coach'}
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}

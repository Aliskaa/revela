import { useCreateCompany } from '@/hooks/admin';
import { Alert, Box, Button, Divider, Drawer, Stack, TextField, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';

const readApiError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const data = (err as { response?: { data?: { error?: string } } }).response?.data;
        if (data?.error) {
            return data.error;
        }
    }
    return err instanceof Error ? err.message : 'Erreur inconnue.';
};

export type CompanyFormHandle = {
    open: () => void;
};

const CompanyForm = forwardRef<CompanyFormHandle>(function CompanyForm(_props, ref) {
    const createCompany = useCreateCompany();

    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const openDrawer = () => {
        createCompany.reset();
        setName('');
        setContactName('');
        setContactEmail('');
        setIsDrawerOpen(true);
    };

    useImperativeHandle(ref, () => ({
        open: openDrawer,
    }));

    const handleClose = () => {
        setIsDrawerOpen(false);
        createCompany.reset();
    };

    const handleCreate = async () => {
        try {
            await createCompany.mutateAsync({
                name: name.trim(),
                contactName: contactName.trim() || null,
                contactEmail: contactEmail.trim() || null,
            });
            setName('');
            setContactName('');
            setContactEmail('');
            createCompany.reset();
            setIsDrawerOpen(false);
        } catch {
            /* Erreur affichée via createCompany.error / createCompany.isError */
        }
    };

    return (
        <>
            <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Plus size={20} />}
                onClick={openDrawer}
                sx={{ boxShadow: 2 }}
            >
                Nouvelle entreprise
            </Button>
            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 450 }, p: 0 },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            Nouvelle entreprise
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Remplissez les informations ci-dessous pour créer une nouvelle entreprise.
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Stack spacing={3} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                        <TextField
                            label="Nom"
                            fullWidth
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        <TextField
                            label="Contact principal (nom)"
                            fullWidth
                            value={contactName}
                            onChange={e => setContactName(e.target.value)}
                        />
                        <TextField
                            label="Contact principal (e-mail)"
                            fullWidth
                            type="email"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                        />

                        {createCompany.isError && createCompany.error ? (
                            <Alert severity="error">{readApiError(createCompany.error)}</Alert>
                        ) : null}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                        <Button variant="outlined" color="inherit" onClick={handleClose}>
                            Annuler
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={createCompany.isPending || name.trim().length === 0}
                            onClick={handleCreate}
                        >
                            {createCompany.isPending ? 'Création...' : "Créer l'entreprise"}
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
});

export default CompanyForm;

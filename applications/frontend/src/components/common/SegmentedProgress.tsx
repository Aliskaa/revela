import { Box } from '@mui/material';

/** Barre segmentée type maquette (étapes 1 → 3). */
export function SegmentedProgress({ activeStep }: { activeStep: 1 | 2 | 3 }) {
    return (
        <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 520, mx: 'auto', mb: 1 }}>
            {([1, 2, 3] as const).map(s => {
                const done = s < activeStep;
                const current = s === activeStep;
                return (
                    <Box
                        key={s}
                        sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: done ? 'primary.main' : current ? 'secondary.main' : 'divider',
                            boxShadow: current ? `0 0 0 2px #ffffff` : 'none',
                            transition: 'background-color 0.2s ease',
                        }}
                    />
                );
            })}
        </Box>
    );
}

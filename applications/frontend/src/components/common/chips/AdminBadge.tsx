import { Chip } from '@mui/material';
import { ShieldCheck } from 'lucide-react';

/** Pastille « Admin » — signale un coach disposant des droits super-admin. */
export function AdminBadge() {
    return (
        <Chip
            size="small"
            icon={<ShieldCheck size={12} />}
            label="Admin"
            sx={{
                borderRadius: 99,
                bgcolor: 'rgb(254,243,199)',
                color: 'rgb(120,53,15)',
                fontWeight: 700,
                height: 22,
            }}
        />
    );
}

import { participantSessionKeys } from '@/hooks/participantSession';
import type { SxProps, Theme } from '@mui/material';
import type { QueryClient } from '@tanstack/react-query';

export function invalidateParticipantSessionQueries(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
    void queryClient.invalidateQueries({ queryKey: participantSessionKeys.session });
    void queryClient.invalidateQueries({ queryKey: participantSessionKeys.campaignPeersRoot });
}

export const aorPrimaryButtonSx: SxProps<Theme> = (theme) => ({
    py: 1.2,
    px: 3.5,
    borderRadius: 2,
    fontWeight: 700,
    boxShadow: theme.palette.shadow.brandMd,
});

import { useCoaches } from '@/hooks/admin';
import { useParticipantSession } from '@/hooks/participantSession';
import { parseAdminJwtClaims } from '@/lib/auth';
import { personInitialsFromLabel, personInitialsFromNames } from '@/lib/personInitials';
import { useAuthStore } from '@/stores/authStore';

export type AppShellUserAvatarModel = {
    src: string | null;
    initials: string;
    alt: string;
};

export function useParticipantAppShellUserAvatar(): AppShellUserAvatarModel {
    const { data: session } = useParticipantSession();
    const fullName =
        session && `${session.first_name} ${session.last_name}`.trim().length > 0
            ? `${session.first_name} ${session.last_name}`.trim()
            : 'Participant';
    return {
        src: session?.avatar_url ?? null,
        initials: session
            ? personInitialsFromNames(session.first_name, session.last_name)
            : personInitialsFromLabel('Participant'),
        alt: fullName,
    };
}

export function useAdminAppShellUserAvatar(): AppShellUserAvatarModel {
    const username = useAuthStore(state => state.adminMe?.username) ?? 'Admin';
    return {
        src: null,
        initials: personInitialsFromLabel(username),
        alt: username,
    };
}

export function useCoachAppShellUserAvatar(): AppShellUserAvatarModel {
    const claims = parseAdminJwtClaims();
    const { data: coaches = [] } = useCoaches();
    const coach = claims?.coachId != null ? coaches.find(c => c.id === claims.coachId) : undefined;
    const displayName =
        coach?.displayName?.trim() || (claims?.scope === 'super-admin' ? 'Admin' : 'Coach');
    return {
        src: null,
        initials: personInitialsFromLabel(displayName),
        alt: displayName,
    };
}

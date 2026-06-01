import { useParticipantSession } from '@/hooks/participantSession';
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
    const adminMe = useAuthStore(state => state.adminMe);
    const displayName = adminMe?.display_name?.trim() || adminMe?.username?.trim() || 'Admin';
    return {
        src: adminMe?.avatar_url ?? null,
        initials: personInitialsFromLabel(displayName),
        alt: displayName,
    };
}

export function useCoachAppShellUserAvatar(): AppShellUserAvatarModel {
    const adminMe = useAuthStore(state => state.adminMe);
    const displayName =
        adminMe?.display_name?.trim() ||
        adminMe?.username?.trim() ||
        (adminMe?.scope === 'super-admin' ? 'Admin' : 'Coach');
    return {
        src: adminMe?.avatar_url ?? null,
        initials: personInitialsFromLabel(displayName),
        alt: displayName,
    };
}

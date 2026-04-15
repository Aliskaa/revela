// ── Questionnaires ────────────────────────────────────────────────────────────

export interface QuestionnaireListItem {
    id: string;
    title: string;
    description: string;
    dimensions: { name: string; icon: string }[];
}

export interface Question {
    question: string;
    threshold: number;
    function: 'ge' | 'le';
}

export interface ResultDim {
    name: string;
    scores: number[];
    diff_pairs?: DiffPair[];
}

export interface DiffPair {
    e: number;
    w: number;
    if_e_gt: string;
    if_w_gt: string;
}

export interface QuestionnaireDetail {
    id: string;
    title: string;
    description: string;
    questions: {
        series_labels: string[];
        series: Question[][];
    };
    score_labels: Record<string, string>;
    short_labels: Record<string, string>;
    result_dims: ResultDim[];
}

// ── Réponses ──────────────────────────────────────────────────────────────────

export interface SubmitPayload {
    info: { name: string; email: string; organisation: string };
    series0: number[];
    series1: number[];
}

export interface SubmitResult {
    response_id: number;
    scores: Record<string, number>;
    qid: string;
}

/** POST /participant/questionnaires/:qid/submit — union (legacy body = element humain). */
export type SubmitParticipantElementHumainBody = {
    series0: number[];
    series1: number[];
};

export type SubmitParticipantSelfRatingBody = {
    kind: 'self_rating';
    scores: Record<string, number>;
};

export type SubmitParticipantPeerRatingBody = {
    kind: 'peer_rating';
    peer_label: string;
    /** Identifiant du pair noté (campagnes) — aligné sur le backend. */
    rated_participant_id?: number;
    scores: Record<string, number>;
};

export type SubmitParticipantQuestionnaireBody =
    | SubmitParticipantElementHumainBody
    | SubmitParticipantSelfRatingBody
    | SubmitParticipantPeerRatingBody;

export type ResponseSubmissionKind = 'element_humain' | 'self_rating' | 'peer_rating';

export interface ResponseDetail {
    id: number;
    questionnaire_id: string;
    submission_kind: ResponseSubmissionKind;
    subject_participant_id: number | null;
    rater_participant_id: number | null;
    rated_participant_id: number | null;
    name: string;
    email: string;
    organisation: string;
    submitted_at: string;
    scores: Record<string, number>;
    result_dims: ResultDim[];
    score_labels: Record<string, string>;
    short_labels: Record<string, string>;
}

export type CampaignStatus = 'draft' | 'active' | 'closed' | 'archived';

// ── Invitations ───────────────────────────────────────────────────────────────

export interface InviteInfo {
    token: string;
    questionnaire_id: string;
    questionnaire_title: string;
    /** True when the participant must set a password (first visit); then use POST /invite/:token/activate. */
    needs_activation: boolean;
    campaign_id: number | null;
    campaign_status: CampaignStatus | null;
    invitation_confirmed: boolean;
    needs_participation_confirmation: boolean;
    /** Identifiant du participant lié au jeton (alignement avec le JWT après connexion). */
    participant_id: number;
    participant: { name: string; email: string; organisation: string };
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminDashboard {
    total_responses: number;
    total_participants: number;
    total_companies: number;
    by_questionnaire: Record<string, { title: string; count: number; last_submitted_at: string | null }>;
}

export interface AdminResponse {
    id: number;
    questionnaire_id: string;
    submission_kind: ResponseSubmissionKind;
    subject_participant_id: number | null;
    rater_participant_id: number | null;
    rated_participant_id: number | null;
    name: string;
    email: string;
    organisation: string;
    submitted_at: string;
    scores: Record<string, number>;
}

export interface ParticipantQuestionnaireMatrixPeerColumn {
    response_id: number;
    label: string;
    rater_participant_id: number | null;
    /** Présent lorsque le feedback a été saisi avec un pair de campagne identifié. */
    rated_participant_id?: number | null;
}

/** GET /participant/campaigns/:campaignId/peers */
export type CampaignPeerChoice = {
    participant_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
};

export interface ParticipantQuestionnaireMatrixRow {
    score_key: number;
    label: string;
    self: number | null;
    peers: (number | null)[];
    scientific: number | null;
}

/** GET /participant/session */
export type ParticipantSession = {
    participant_id: number;
    email: string;
    first_name: string;
    last_name: string;
    assignments: Array<{
        campaign_id: number | null;
        campaign_name: string | null;
        company_id: number | null;
        company_name: string | null;
        coach_id: number | null;
        coach_name: string | null;
        questionnaire_id: string;
        questionnaire_title: string;
        campaign_status: CampaignStatus | null;
        allow_test_without_manual_inputs: boolean;
        invitation_confirmed: boolean;
        progression: {
            self_rating_status: 'locked' | 'pending' | 'completed';
            peer_feedback_status: 'locked' | 'pending' | 'completed';
            element_humain_status: 'locked' | 'pending' | 'completed';
            results_status: 'locked' | 'pending' | 'completed';
        } | null;
    }>;
};

/** GET /participant/matrix ou GET /admin/participants/:id/matrix?qid= — même forme DTO (ADR-001). */
export interface ParticipantQuestionnaireMatrix {
    subject_id: number;
    questionnaire_id: string;
    questionnaire_title: string;
    likert_max: number;
    scientific_value_max: number;
    peer_columns: ParticipantQuestionnaireMatrixPeerColumn[];
    self_response_id: number | null;
    scientific_response_id: number | null;
    rows: ParticipantQuestionnaireMatrixRow[];
    result_dims: ResultDim[];
    short_labels: Record<string, string>;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pages: number;
    per_page: number;
}

export interface Participant {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    company: { id: number; name: string } | null;
    invite_status: Record<string, string>;
    response_count: number;
}

export interface Company {
    id: number;
    name: string;
    contact_name: string | null;
    contact_email: string | null;
    participant_count: number;
}

export interface Coach {
    id: number;
    username: string;
    displayName: string;
    isActive: boolean;
    createdAt: string | null;
}

export type AdminCoachLinkedCampaign = {
    id: number;
    coachId: number;
    companyId: number;
    name: string;
    questionnaireId: string | null;
    status: CampaignStatus;
    allowTestWithoutManualInputs: boolean;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string | null;
};

export type AdminCoachDetail = {
    coach: Coach;
    campaigns: AdminCoachLinkedCampaign[];
};

export interface AdminCampaign {
    id: number;
    coachId: number;
    companyId: number;
    name: string;
    questionnaireId: string | null;
    status: CampaignStatus;
    allowTestWithoutManualInputs: boolean;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string | null;
}

export interface AdminCampaignDetail {
    campaign: AdminCampaign;
    participant_progress: Array<{
        participantId: number;
        fullName: string;
        email: string;
        selfRatingStatus: 'locked' | 'pending' | 'completed';
        peerFeedbackStatus: 'locked' | 'pending' | 'completed';
        elementHumainStatus: 'locked' | 'pending' | 'completed';
        resultsStatus: 'locked' | 'pending' | 'completed';
    }>;
    responses: AdminResponse[];
    responses_total: number;
}

export interface InviteToken {
    id: number;
    token: string;
    questionnaire_id: string;
    status: string;
    created_at: string;
    expires_at: string | null;
    used_at?: string | null;
    invite_url: string;
}

/** Réponse POST /admin/participants/:id/invite */
export interface CreateInviteResult extends InviteToken {
    mail_sent: boolean;
    mail_error: string | null;
    mail_configured: boolean;
}

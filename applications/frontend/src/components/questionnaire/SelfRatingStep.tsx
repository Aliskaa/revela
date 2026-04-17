import type { QuestionnaireDetail } from '@aor/types';
import { DimensionCards } from '@/components/common/DimensionCards';
import { useParticipantSessionMatrix } from '@/hooks/participantSession';
import { useSubmitParticipantQuestionnaire } from '@/hooks/questionnaires';
import { Alert, Box, Button, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { aorPrimaryButtonSx, buildDimensionScoreMap, invalidateParticipantSessionQueries } from './helpers';

type SelfRatingStepProps = {
    qid: string;
    q: QuestionnaireDetail;
    campaignId: number | null;
};

export function SelfRatingStep({ qid, q, campaignId }: SelfRatingStepProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const submitSelf = useSubmitParticipantQuestionnaire(qid, campaignId);
    const { data: matrix } = useParticipantSessionMatrix(true, qid, campaignId);
    const [scores, setScores] = useState(() => buildDimensionScoreMap(q));
    const [didInitFromMatrix, setDidInitFromMatrix] = useState(false);

    useEffect(() => {
        if (!matrix || didInitFromMatrix || matrix.self_response_id === null) {
            return;
        }

        setScores(prev => {
            const next = { ...prev };
            for (const row of matrix.rows) {
                if (row.self !== null) {
                    next[String(row.score_key)] = row.self;
                }
            }
            return next;
        });
        setDidInitFromMatrix(true);
    }, [matrix, didInitFromMatrix]);

    const onScoreChange = (key: string, value: number) => {
        setScores(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        submitSelf.mutate(
            { kind: 'self_rating', scores },
            {
                onSuccess: () => {
                    invalidateParticipantSessionQueries(queryClient);
                    navigate({ to: '/participant' });
                },
            }
        );
    };

    return (
        <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 720 }}>
                Évaluez chaque dimension : barre bleue pour le comportement exprimé, barre jaune pour le comportement
                souhaité. Échelle 0-9.
            </Typography>

            {submitSelf.isError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {submitSelf.error.message}
                </Alert>
            )}

            <DimensionCards q={q} values={scores} onScoreChange={onScoreChange} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={submitSelf.isPending}
                    onClick={handleSave}
                    endIcon={<Sparkles size={18} />}
                    sx={aorPrimaryButtonSx}
                >
                    {submitSelf.isPending ? 'Enregistrement...' : 'Valider mon auto-évaluation'}
                </Button>
            </Box>
        </Box>
    );
}

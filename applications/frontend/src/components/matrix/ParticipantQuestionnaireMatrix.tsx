import { useParticipantQuestionnaireMatrix } from '@/hooks/admin';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import { Alert, Box, Card, CircularProgress, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { QuestionnaireMatrixDisplay } from './QuestionnaireMatrixDisplay';

type ParticipantQuestionnaireMatrixProps = {
    participantId: number;
    qid: string;
    onQidChange?: (qid: string) => void;
};

export function ParticipantQuestionnaireMatrix({
    participantId,
    qid,
    onQidChange,
}: ParticipantQuestionnaireMatrixProps) {
    const { data, isLoading, error } = useParticipantQuestionnaireMatrix(participantId, qid);
    const { data: questionnaires } = useAdminQuestionnaires();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
                Impossible de charger les données de la matrice pour ce participant.
            </Alert>
        );
    }

    return (
        <Card sx={{ borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'visible' }}>
            <Box
                sx={{
                    p: 2.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                }}
            >
                {onQidChange !== undefined && questionnaires !== undefined && (
                    <FormControl size="small" sx={{ minWidth: 280 }}>
                        <InputLabel id="matrix-qid-label">Évaluation analysée</InputLabel>
                        <Select
                            labelId="matrix-qid-label"
                            label="Évaluation analysée"
                            value={qid}
                            onChange={e => onQidChange(String(e.target.value))}
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                        >
                            {questionnaires.map(q => (
                                <MenuItem key={q.id} value={q.id}>
                                    {q.id} — {q.title}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <QuestionnaireMatrixDisplay matrix={data} />
            </Box>
        </Card>
    );
}

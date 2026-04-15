import * as React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AdminDrawerForm } from "./AdminDrawerForm";

export type CompanyDrawerMode = "create" | "edit";

export type CompanyFormValues = {
  name: string;
  contactName: string;
  contactEmail: string;
  campaignCount: number;
  participantCount: number;
  status: "active" | "inactive";
  notes: string;
};

export type AdminCompanyDrawerFormProps = {
  open: boolean;
  mode: CompanyDrawerMode;
  initialValues?: Partial<CompanyFormValues>;
  onClose: () => void;
  onSubmit: (values: CompanyFormValues) => void;
  isSubmitting?: boolean;
};

const defaultValues: CompanyFormValues = {
  name: "",
  contactName: "",
  contactEmail: "",
  campaignCount: 0,
  participantCount: 0,
  status: "active",
  notes: "",
};

export function AdminCompanyDrawerForm({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminCompanyDrawerFormProps) {
  const [values, setValues] = React.useState<CompanyFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  React.useEffect(() => {
    if (open) {
      setValues({
        ...defaultValues,
        ...initialValues,
      });
    }
  }, [open, initialValues]);

  const title = mode === "create" ? "Nouvelle entreprise" : "Éditer l’entreprise";
  const subtitle =
    mode === "create"
      ? "Créer une entreprise et la relier à ses campagnes."
      : "Mettre à jour les informations de l’entreprise.";

  const handleChange = <K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => onSubmit(values);

  return (
    <AdminDrawerForm
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={mode === "create" ? "Créer" : "Enregistrer"}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2.25}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Identité
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Nom de l’entreprise"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              fullWidth
            />
            <TextField
              label="Contact principal"
              value={values.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
              fullWidth
            />
            <TextField
              label="Email du contact"
              value={values.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              fullWidth
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Volume
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Nombre de campagnes"
              type="number"
              value={values.campaignCount}
              onChange={(e) => handleChange("campaignCount", Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Nombre de participants"
              type="number"
              value={values.participantCount}
              onChange={(e) => handleChange("participantCount", Number(e.target.value))}
              fullWidth
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Statut
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="company-status-label">Statut</InputLabel>
            <Select
              labelId="company-status-label"
              label="Statut"
              value={values.status}
              onChange={(e) => handleChange("status", e.target.value as CompanyFormValues["status"])}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Notes
          </Typography>
          <TextField
            label="Commentaire"
            value={values.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
        </Box>
      </Stack>
    </AdminDrawerForm>
  );
}

/*
Usage:

const [open, setOpen] = useState(false);

<AdminCompanyDrawerForm
  open={open}
  mode="create"
  onClose={() => setOpen(false)}
  onSubmit={(values) => {
    console.log(values);
  }}
/>
*/

import { useState, type FormEvent, type ReactNode } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ErrorNotice } from "./LoadState";
import { errorMessage } from "../api/errors";
import { COLORS } from "../theme";

// Dialog shell for every create/edit form. `onSubmit` may throw (an ApiError for
// validation, or whatever the API call rejects with) and the message is shown
// above the fields; on success the dialog closes itself.
export default function FormDialog({
  open,
  title,
  subtitle,
  submitLabel = "Save",
  onSubmit,
  onClose,
  secondaryAction,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  submitLabel?: string;
  onSubmit: () => Promise<void>;
  onClose: () => void;
  secondaryAction?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={fullScreen}
      slotProps={{ transition: { onExited: () => setError(null) } }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {subtitle && (
            <Typography variant="body2" color={COLORS.muted} mb={2}>
              {subtitle}
            </Typography>
          )}
          {error && (
            <Box mb={2}>
              <ErrorNotice message={error} />
            </Box>
          )}
          <Stack spacing={2.25} pt={1}>
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          {secondaryAction}
          <Box flex={1} />
          <Button onClick={onClose} disabled={submitting} sx={{ color: COLORS.muted }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

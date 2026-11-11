import { useState, type ReactNode } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { ErrorNotice } from "./LoadState";
import { errorMessage } from "../api/errors";
import { COLORS } from "../theme";

// Confirmation for destructive actions. Closes itself once `onConfirm` resolves.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ transition: { onExited: () => setError(null) } }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Box mb={2}>
            <ErrorNotice message={error} />
          </Box>
        )}
        <Typography variant="body2" color={COLORS.muted}>
          {message}
        </Typography>
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={busy} sx={{ color: COLORS.muted }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={confirm}
          disabled={busy}
          sx={{ background: COLORS.negative, color: COLORS.surface, "&:hover": { background: "#8C3624" } }}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

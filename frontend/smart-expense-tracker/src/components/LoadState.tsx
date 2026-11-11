import { Box, Button, CircularProgress, Stack } from "@mui/material";
import { COLORS } from "../theme";

export function Loading({ minHeight = 160 }: { minHeight?: number }) {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight }}>
      <CircularProgress size={22} thickness={5} sx={{ color: COLORS.accent }} />
    </Box>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={2}
      role="alert"
      sx={{
        borderLeft: `3px solid ${COLORS.negative}`,
        background: COLORS.negativeSoft,
        color: COLORS.negative,
        fontSize: 13.5,
        px: 1.5,
        py: 1,
      }}
    >
      <span>{message}</span>
      {onRetry && (
        <Button size="small" onClick={onRetry} sx={{ color: COLORS.negative, minWidth: 0, flexShrink: 0 }}>
          Retry
        </Button>
      )}
    </Stack>
  );
}

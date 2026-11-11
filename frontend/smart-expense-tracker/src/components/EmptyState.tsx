import { type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { COLORS, FONT_SERIF } from "../theme";

export default function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack alignItems="center" textAlign="center" py={6} px={2} gap={1}>
      {icon && (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            display: "grid",
            placeItems: "center",
            color: COLORS.muted,
            mb: 1,
            "& svg": { fontSize: 22 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography fontFamily={FONT_SERIF} fontSize={18} fontWeight={500} color={COLORS.ink}>
        {title}
      </Typography>
      {body && (
        <Typography variant="body2" color={COLORS.muted} maxWidth={380}>
          {body}
        </Typography>
      )}
      {action && <Box mt={1.5}>{action}</Box>}
    </Stack>
  );
}

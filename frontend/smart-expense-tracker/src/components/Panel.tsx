import { type ReactNode } from "react";
import { Box, Card, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { cardSx } from "./styles";
import { COLORS, FONT_SERIF } from "../theme";

// The standard white card. `link` renders a "View all →" style link in the header.
export default function Panel({
  title,
  subtitle,
  action,
  link,
  children,
  sx,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  link?: { label: string; to: string };
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  const navigate = useNavigate();
  const hasHeader = title || action || link;
  return (
    <Card sx={[cardSx, ...(Array.isArray(sx) ? sx : [sx])]}>
      {hasHeader && (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} mb={2.5}>
          <Box>
            {title && (
              <Typography component="h2" fontFamily={FONT_SERIF} fontSize={18} fontWeight={500} color={COLORS.ink}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color={COLORS.muted} display="block" mt={0.25}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
          {link && (
            <Typography
              component="button"
              onClick={() => navigate(link.to)}
              fontSize={13}
              fontWeight={600}
              color={COLORS.accent}
              sx={{
                background: "none",
                border: "none",
                p: 0,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                "&:hover": { opacity: 0.75 },
              }}
            >
              {link.label} →
            </Typography>
          )}
        </Stack>
      )}
      {children}
    </Card>
  );
}

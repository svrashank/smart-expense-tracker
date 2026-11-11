import { type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ProfileAvatar } from "./DashboardLayout";
import { COLORS, FONT_SERIF } from "../theme";

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "flex-start" }}
      gap={2}
      mb={4}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box>
          <Typography
            component="h1"
            fontFamily={FONT_SERIF}
            fontWeight={500}
            fontSize={{ xs: 24, md: 28 }}
            color={COLORS.ink}
            sx={{ letterSpacing: "-0.01em" }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color={COLORS.muted} mt={0.5}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: { xs: "block", sm: "none" } }}>
          <ProfileAvatar />
        </Box>
      </Stack>
      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        {actions}
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <ProfileAvatar />
        </Box>
      </Stack>
    </Stack>
  );
}

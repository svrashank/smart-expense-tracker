import { type ReactNode } from "react";
import { Box, Card, Typography } from "@mui/material";
import { COLORS, FONT_SERIF } from "../theme";

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.bg,
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Typography
          align="center"
          fontFamily={FONT_SERIF}
          fontWeight={600}
          fontSize={24}
          color={COLORS.ink}
          letterSpacing="-0.01em"
          mb={4}
        >
          Centsible
        </Typography>

        <Card
          sx={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            boxShadow: "none",
            p: { xs: 3, sm: 4 },
          }}
        >
          <Typography fontFamily={FONT_SERIF} fontWeight={500} fontSize={21} color={COLORS.ink} mb={0.5}>
            {title}
          </Typography>
          <Typography variant="body2" color={COLORS.muted} mb={3.5}>
            {subtitle}
          </Typography>
          {children}
        </Card>
      </Box>
    </Box>
  );
}

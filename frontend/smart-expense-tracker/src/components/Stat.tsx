import { type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import { COLORS, FONT_SANS } from "../theme";
import { formatPct } from "../lib/format";

// Signed % change. Colour comes from whether the move is good, not its direction:
// expenses going up is bad, income going up is good.
export function Delta({ value, goodWhen = "up", period }: { value: number | null; goodWhen?: "up" | "down"; period?: string }) {
  if (value === null) return null;
  const up = value >= 0;
  const good = up === (goodWhen === "up");
  const color = value === 0 ? COLORS.muted : good ? COLORS.accent : COLORS.negative;
  const Icon = up ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
  return (
    <Stack direction="row" alignItems="center" gap={0.25} sx={{ color }} title={period ? `vs ${period}` : undefined}>
      <Icon sx={{ fontSize: 13 }} />
      <Typography fontSize={12.5} fontWeight={600}>
        {formatPct(Math.abs(value))}
      </Typography>
      {period && (
        <Typography fontSize={12.5} color={COLORS.muted} ml={0.5}>
          vs {period}
        </Typography>
      )}
    </Stack>
  );
}

export default function Stat({
  label,
  value,
  delta,
  caption,
  size = "md",
  valueColor = COLORS.ink,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  caption?: ReactNode;
  size?: "hero" | "md";
  valueColor?: string;
}) {
  const hero = size === "hero";
  return (
    <Box minWidth={0}>
      <Typography fontSize={13} fontWeight={500} color={COLORS.muted}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" gap={1.25} mt={0.5} flexWrap="wrap">
        <Typography
          fontFamily={FONT_SANS}
          fontWeight={600}
          fontSize={hero ? { xs: 36, md: 48 } : 21}
          lineHeight={1.1}
          color={valueColor}
          sx={{ letterSpacing: hero ? "-0.02em" : "-0.01em" }}
        >
          {value}
        </Typography>
        {delta}
      </Stack>
      {caption && (
        <Typography fontSize={12.5} color={COLORS.muted} mt={0.75}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

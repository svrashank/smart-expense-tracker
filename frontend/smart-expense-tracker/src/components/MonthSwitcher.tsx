import { IconButton, Stack, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { formatMonth } from "../lib/format";
import { COLORS } from "../theme";

export default function MonthSwitcher({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(d.getMonth() + 1, d.getFullYear());
  };
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 1, background: COLORS.surface, height: 36.5 }}
    >
      <IconButton size="small" aria-label="Previous month" onClick={() => shift(-1)} sx={{ color: COLORS.muted }}>
        <ChevronLeftRoundedIcon fontSize="small" />
      </IconButton>
      <Typography fontSize={14} fontWeight={600} color={COLORS.ink} sx={{ minWidth: 118, textAlign: "center" }} aria-live="polite">
        {formatMonth(month, year)}
      </Typography>
      <IconButton size="small" aria-label="Next month" onClick={() => shift(1)} sx={{ color: COLORS.muted }}>
        <ChevronRightRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

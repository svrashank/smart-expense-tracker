import { Box } from "@mui/material";
import { COLORS } from "../theme";

// Thin progress bar. `value` is a fraction; anything above 1 is drawn full.
export default function Meter({
  value,
  color = COLORS.accent,
  track = COLORS.bg,
  height = 6,
  label,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <Box
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      sx={{ height, borderRadius: height, background: track, overflow: "hidden" }}
    >
      <Box sx={{ height: "100%", width: `${pct}%`, background: color, borderRadius: height, transition: "width 0.3s" }} />
    </Box>
  );
}

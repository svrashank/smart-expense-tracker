import { COLORS } from "../theme";

export const cardSx = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",
  p: { xs: 2.5, md: 3 },
  boxShadow: "none",
};

// Dims stale content while a refetch is in flight instead of swapping in a spinner.
export const refetchSx = (loading: boolean) => ({
  opacity: loading ? 0.55 : 1,
  transition: "opacity 0.15s",
});

export const authFieldSx = {
  "& .MuiInputLabel-root": { color: COLORS.muted, fontSize: 14.5 },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.accent },
  "& .MuiInput-root": { color: COLORS.ink, fontFamily: "inherit" },
  "& .MuiInput-root:before": { borderBottomColor: COLORS.border },
  "& .MuiInput-root:hover:not(.Mui-disabled):before": { borderBottomColor: COLORS.ink },
  "& .MuiInput-root:after": { borderBottomColor: COLORS.accent },
  "& .MuiSvgIcon-root": { color: COLORS.muted, fontSize: 20 },
};

export const authButtonSx = {
  borderRadius: "4px",
  height: 48,
  fontSize: 15,
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "none",
  background: COLORS.ink,
  color: COLORS.bg,
  "&:hover": { background: COLORS.accent, boxShadow: "none" },
  "&.Mui-disabled": { background: COLORS.border, color: COLORS.faint },
};

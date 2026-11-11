import { createTheme } from "@mui/material/styles";

export const COLORS = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  border: "#E7E0D4",
  ink: "#2B2620",
  muted: "#7A7266",
  faint: "#B3AA9C",
  accent: "#3F6C51",
  accentSoft: "#EBF0EC",
  negative: "#A6432D",
  negativeSoft: "#F6E9E5",
  warning: "#B7791F",
  warningSoft: "#F7EEDD",
};

// Categorical hues for expense categories and asset types, assigned in this
// fixed order and never cycled. Validated (chroma, colour-blind separation,
// contrast on white) with the dataviz palette validator; re-run it before
// changing or reordering any of these.
export const CATEGORY_PALETTE = [
  "#2F72B8",
  "#B87A0C",
  "#0F8C7E",
  "#5B52C8",
  "#A3488A",
  "#6E9020",
  "#D6507E",
  "#9A6A2A",
];

// Anything past the 8th slot folds into this neutral instead of a new hue.
export const OTHER_COLOR = "#A39A8C";

export const FONT_SERIF = "'Fraunces', Georgia, serif";
export const FONT_SANS = "'Inter', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

export const muiTheme = createTheme({
  palette: {
    primary: { main: COLORS.accent, contrastText: COLORS.surface },
    secondary: { main: COLORS.ink, contrastText: COLORS.bg },
    error: { main: COLORS.negative },
    warning: { main: COLORS.warning },
    success: { main: COLORS.accent },
    text: { primary: COLORS.ink, secondary: COLORS.muted },
    divider: COLORS.border,
    background: { default: COLORS.bg, paper: COLORS.surface },
  },
  typography: {
    fontFamily: FONT_SANS,
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 4, fontSize: 14 },
        containedPrimary: {
          background: COLORS.ink,
          color: COLORS.bg,
          "&:hover": { background: COLORS.accent },
        },
        outlined: {
          borderColor: COLORS.border,
          color: COLORS.ink,
          "&:hover": { borderColor: COLORS.ink, background: "transparent" },
        },
        text: { color: COLORS.accent },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 6, border: `1px solid ${COLORS.border}`, boxShadow: "0 12px 40px rgba(43,38,32,0.12)" },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 20, paddingBottom: 4 } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { border: `1px solid ${COLORS.border}`, boxShadow: "0 6px 20px rgba(43,38,32,0.08)" },
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: 14 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: COLORS.surface,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.faint },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: COLORS.muted } },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          color: COLORS.muted,
          borderColor: COLORS.border,
          padding: "6px 14px",
          "&.Mui-selected": { background: COLORS.ink, color: COLORS.bg },
          "&.Mui-selected:hover": { background: COLORS.ink },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, fontSize: 14, minWidth: 0, padding: "10px 4px", marginRight: 24 },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { height: 2 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { background: COLORS.ink, fontSize: 12, fontWeight: 500, padding: "6px 10px" },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 4, fontWeight: 600 } },
    },
  },
});

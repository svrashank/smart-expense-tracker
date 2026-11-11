import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Box, Drawer, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DonutLargeOutlinedIcon from "@mui/icons-material/DonutLargeOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import { getMe, logout } from "../api";
import type { User } from "../api/types";
import { useApi } from "../hooks/useApi";
import { UserContext, displayName, useUser } from "../context/user";
import { COLORS, FONT_SERIF } from "../theme";

const NAV_ITEMS: { label: string; path: string; icon: SvgIconComponent }[] = [
  { label: "Overview", path: "/home", icon: SpaceDashboardOutlinedIcon },
  { label: "Transactions", path: "/transactions", icon: ReceiptLongOutlinedIcon },
  { label: "Budgets", path: "/budgets", icon: DonutLargeOutlinedIcon },
  { label: "Goals", path: "/goals", icon: FlagOutlinedIcon },
  { label: "Investments", path: "/investments", icon: ShowChartOutlinedIcon },
  { label: "Accounts", path: "/accounts", icon: AccountBalanceOutlinedIcon },
];

const SIDEBAR_WIDTH = 224;

function NavLink({
  label,
  icon: Icon,
  active,
  danger,
  onClick,
}: {
  label: string;
  icon: SvgIconComponent;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        pl: 1.75,
        pr: 1.5,
        py: 1,
        border: "none",
        background: "none",
        fontFamily: "inherit",
        textAlign: "left",
        cursor: "pointer",
        color: danger ? COLORS.negative : active ? COLORS.ink : COLORS.muted,
        fontWeight: active ? 600 : 500,
        transition: "color 0.15s",
        "&:hover": danger ? { opacity: 0.75 } : { color: COLORS.ink },
        "&:focus-visible": { outline: `2px solid ${COLORS.accent}`, outlineOffset: -2 },
        "&::before": active
          ? { content: '""', position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, background: COLORS.accent }
          : undefined,
      }}
    >
      <Icon sx={{ fontSize: 19 }} />
      <Typography fontSize={14} fontWeight="inherit" color="inherit">
        {label}
      </Typography>
    </Box>
  );
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", py: 3.5, px: 2.5 }}>
      <Typography fontFamily={FONT_SERIF} fontWeight={600} fontSize={21} color={COLORS.ink} letterSpacing="-0.01em" px={0.5} mb={5}>
        Centsible
      </Typography>

      <Stack spacing={0.5} flex={1} component="nav" aria-label="Main">
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <NavLink key={path} label={label} icon={icon} active={location.pathname.startsWith(path)} onClick={() => go(path)} />
        ))}
      </Stack>

      <Stack spacing={0.5}>
        <NavLink
          label="Settings"
          icon={SettingsOutlinedIcon}
          active={location.pathname.startsWith("/settings")}
          onClick={() => go("/settings")}
        />
        <NavLink label="Log out" icon={LogoutOutlinedIcon} danger onClick={handleLogout} />
      </Stack>
    </Box>
  );
}

// Layout route for every signed-in page. Loads the current user once and shares
// it through UserContext. Once the backend is wired, a 401 from getMe() is where
// the redirect to /login belongs.
export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const me = useApi(getMe, []);
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);
  const user = updatedUser ?? me.data ?? null;

  return (
    <UserContext.Provider value={{ user, setUser: setUpdatedUser }}>
      <Box sx={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
        {/* ---------------- SIDEBAR (md+) ---------------- */}
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
            display: { xs: "none", md: "block" },
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <NavContent />
        </Box>

        {/* ---------------- TOP BAR + DRAWER (mobile) ---------------- */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            px: 1,
            zIndex: 10,
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <IconButton aria-label="Open menu" onClick={() => setDrawerOpen(true)} sx={{ color: COLORS.ink }}>
            <MenuRoundedIcon />
          </IconButton>
          <Typography fontFamily={FONT_SERIF} fontWeight={600} fontSize={19} color={COLORS.ink}>
            Centsible
          </Typography>
        </Box>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ display: { md: "none" } }}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH + 16, background: COLORS.bg } } }}
        >
          <NavContent onNavigate={() => setDrawerOpen(false)} />
        </Drawer>

        {/* ---------------- CONTENT ---------------- */}
        <Box component="main" sx={{ flex: 1, ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` }, mt: { xs: "56px", md: 0 }, minWidth: 0 }}>
          <Box sx={{ px: { xs: 2, md: 5 }, py: { xs: 3, md: 5 }, maxWidth: 1280, mx: "auto" }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </UserContext.Provider>
  );
}

export function ProfileAvatar() {
  const navigate = useNavigate();
  const { user } = useUser();
  const name = displayName(user);
  return (
    <Tooltip title="Profile & settings">
      <Avatar
        component="button"
        aria-label="Profile and settings"
        onClick={() => navigate("/settings")}
        sx={{
          width: 38,
          height: 38,
          border: "none",
          cursor: "pointer",
          bgcolor: COLORS.ink,
          color: COLORS.bg,
          fontFamily: FONT_SERIF,
          fontWeight: 600,
          fontSize: 15,
          "&:hover": { opacity: 0.85 },
        }}
      >
        {name ? name.charAt(0).toUpperCase() : ""}
      </Avatar>
    </Tooltip>
  );
}

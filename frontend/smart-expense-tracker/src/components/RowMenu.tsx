import { useState, type ReactNode } from "react";
import { IconButton, ListItemIcon, Menu, MenuItem } from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { COLORS } from "../theme";

export interface RowMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export default function RowMenu({ items, label = "More actions" }: { items: RowMenuItem[]; label?: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton
        size="small"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        sx={{ color: COLORS.muted, "&:hover": { color: COLORS.ink } }}
      >
        <MoreHorizRoundedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              setAnchor(null);
              item.onClick();
            }}
            sx={{ color: item.danger ? COLORS.negative : COLORS.ink, minWidth: 160 }}
          >
            {item.icon && <ListItemIcon sx={{ color: "inherit", minWidth: 30, "& svg": { fontSize: 18 } }}>{item.icon}</ListItemIcon>}
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

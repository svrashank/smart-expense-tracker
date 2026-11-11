import { Box, Stack, Typography } from "@mui/material";
import { COLORS, OTHER_COLOR } from "../theme";

export default function CategoryDot({ color = OTHER_COLOR, size = 7 }: { color?: string; size?: number }) {
  return <Box component="span" sx={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />;
}

// Dot + name. The colour is identity only; the text always names the category.
export function CategoryLabel({ name, color, fontSize = 12.5 }: { name: string; color?: string; fontSize?: number }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75} minWidth={0}>
      <CategoryDot color={color} />
      <Typography fontSize={fontSize} color={COLORS.muted} noWrap>
        {name}
      </Typography>
    </Stack>
  );
}

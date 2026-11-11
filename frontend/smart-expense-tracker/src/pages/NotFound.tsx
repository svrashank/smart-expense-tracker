import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { COLORS, FONT_SERIF } from "../theme";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", background: COLORS.bg, px: 2 }}>
      <Box textAlign="center">
        <Typography fontFamily={FONT_SERIF} fontSize={56} fontWeight={500} color={COLORS.faint} lineHeight={1}>
          404
        </Typography>
        <Typography fontFamily={FONT_SERIF} fontSize={22} fontWeight={500} color={COLORS.ink} mt={2}>
          This page doesn't exist
        </Typography>
        <Typography variant="body2" color={COLORS.muted} mt={1} mb={3}>
          The link may be old, or the address mistyped.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/home")}>
          Back to overview
        </Button>
      </Box>
    </Box>
  );
}

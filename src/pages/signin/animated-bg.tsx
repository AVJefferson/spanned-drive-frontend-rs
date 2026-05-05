import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export function AnimatedBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const blobBase = {
    position: "absolute" as const,
    borderRadius: "50%",
    filter: "blur(70px)",
    opacity: isDark ? 0.55 : 0.45,
    pointerEvents: "none" as const,
    willChange: "transform",
  };

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        background: isDark
          ? `radial-gradient(circle at 20% 10%, ${alpha(
              theme.palette.primary.dark,
              0.45,
            )} 0%, transparent 55%), radial-gradient(circle at 85% 85%, ${alpha(
              theme.palette.secondary.main,
              0.3,
            )} 0%, transparent 60%), linear-gradient(180deg, #050b16 0%, #0a1426 100%)`
          : `radial-gradient(circle at 15% 0%, ${alpha(
              theme.palette.primary.main,
              0.16,
            )} 0%, transparent 50%), radial-gradient(circle at 90% 90%, ${alpha(
              theme.palette.primary.light,
              0.22,
            )} 0%, transparent 55%), linear-gradient(180deg, #f0f7fc 0%, #e2eef7 100%)`,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)"
            : "radial-gradient(rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85), transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85), transparent 75%)",
        },
        "@keyframes blobA": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, 30px) scale(1.08)" },
        },
        "@keyframes blobB": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-50px, 20px) scale(1.05)" },
        },
        "@keyframes blobC": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(20px, -40px) scale(1.1)" },
        },
      }}
    >
      <Box
        sx={{
          ...blobBase,
          width: 460,
          height: 460,
          top: "-12%",
          left: "-8%",
          background: alpha(theme.palette.primary.main, isDark ? 0.5 : 0.35),
          animation: "blobA 14s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          ...blobBase,
          width: 380,
          height: 380,
          bottom: "-10%",
          right: "-6%",
          background: alpha(theme.palette.secondary.main, isDark ? 0.4 : 0.3),
          animation: "blobB 18s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          ...blobBase,
          width: 320,
          height: 320,
          top: "30%",
          right: "20%",
          background: alpha(
            theme.palette.primary.light,
            isDark ? 0.32 : 0.28,
          ),
          animation: "blobC 22s ease-in-out infinite",
          display: { xs: "none", md: "block" },
        }}
      />
    </Box>
  );
}

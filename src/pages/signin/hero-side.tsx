import type { ReactElement } from "react";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { SpannedLogoMark } from "./icons";

const FEATURES: { title: string; body: string; icon: ReactElement }[] = [
  {
    title: "Unified storage",
    body: "Combine Google Drive, OneDrive and more into a single logical folder space.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          d="M4 7h6l2 2h8v9a2 2 0 0 1-2 2H4Zm0 0V5a1 1 0 0 1 1-1h4l2 2h7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    title: "Smart placement",
    body: "Big files split into chunks and route to whichever drive has room.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          d="M12 3v8m0 0L8 7m4 4 4-4M5 13v6h14v-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    title: "Yours, always",
    body: "We never read your file contents. Tokens stored only in your browser.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="m9 12 2.2 2.2L15 10.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
];

export function HeroSide() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack
      spacing={{ xs: 3, md: 4.5 }}
      sx={{
        height: "100%",
        justifyContent: "center",
        color: "text.primary",
        textAlign: { xs: "center", md: "left" },
        alignItems: { xs: "center", md: "flex-start" },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ flexWrap: "wrap", justifyContent: { xs: "center", md: "flex-start" } }}
      >
        <Box sx={{ display: "flex" }}>{SpannedLogoMark}</Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.3,
          }}
        >
          Spanned Drive
        </Typography>
        <Chip
          label="Beta"
          size="small"
          sx={{
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            fontSize: "0.65rem",
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
            color: theme.palette.primary.main,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
          }}
        />
      </Stack>

      <Stack spacing={2}>
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -0.5,
            fontSize: { xs: "2.1rem", sm: "2.6rem", md: "3.4rem" },
            backgroundImage: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.light} 60%, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          One drive.
          <br />
          Every cloud.
          <br />
          <br />
          </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "text.secondary",
            maxWidth: 520,
            lineHeight: 1.55,
            fontWeight: 500,
            fontSize: { xs: "1rem", md: "1.1rem" },
          }}
        >
          Sign in with your primary cloud to start. Add more drives later
          to span large files across them seamlessly.
        </Typography>
      </Stack>

      <Stack
        spacing={1.5}
        sx={{ width: "100%", maxWidth: 520, display: { xs: "none", md: "flex" } }}
      >
        {FEATURES.map((feature) => (
          <Stack
            key={feature.title}
            direction="row"
            spacing={1.75}
            alignItems="flex-start"
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.32 : 0.18)}`,
              }}
            >
              {feature.icon}
            </Box>
            <Stack spacing={0.25} sx={{ pt: 0.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {feature.body}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

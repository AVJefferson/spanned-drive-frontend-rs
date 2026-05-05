import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import type { SignInProvider } from "./providers";

interface ProviderButtonProps {
  provider: SignInProvider;
  variant?: "primary" | "ghost";
  onSelect: (provider: SignInProvider) => void;
}

export function ProviderButton({
  provider,
  variant = "primary",
  onSelect,
}: ProviderButtonProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const disabled = !provider.available;

  const baseBg =
    variant === "primary"
      ? isDark
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.primary.main, 0.05)
      : "transparent";

  const baseBorder = isDark
    ? alpha(theme.palette.primary.light, 0.22)
    : alpha(theme.palette.primary.dark, 0.18);

  const hoverBg = isDark
    ? alpha(theme.palette.primary.main, 0.18)
    : alpha(theme.palette.primary.main, 0.1);

  const hoverBorder = theme.palette.primary.main;

  return (
    <Box
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onSelect(provider);
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(provider);
        }
      }}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.75,
        width: "100%",
        px: 2.25,
        py: 1.5,
        borderRadius: 999,
        bgcolor: baseBg,
        border: "1.5px solid",
        borderColor: baseBorder,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.62 : 1,
        transition: "transform 160ms ease, box-shadow 200ms ease, background-color 200ms ease, border-color 200ms ease",
        outline: "none",
        "&:hover": disabled
          ? {}
          : {
              bgcolor: hoverBg,
              borderColor: hoverBorder,
              transform: "translateY(-1px)",
              boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, isDark ? 0.35 : 0.18)}`,
            },
        "&:focus-visible": disabled
          ? {}
          : {
              borderColor: hoverBorder,
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`,
            },
        "&:active": disabled
          ? {}
          : {
              transform: "translateY(0)",
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.18)}`,
            },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: isDark ? alpha("#ffffff", 0.06) : "#ffffff",
          border: `1px solid ${isDark ? alpha("#ffffff", 0.08) : alpha(theme.palette.divider, 0.6)}`,
          flexShrink: 0,
          filter: disabled ? "grayscale(0.5)" : "none",
        }}
      >
        {provider.providerIcon}
      </Box>

      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            color: "text.primary",
            textAlign: "left",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Continue with {provider.providerLabel}
        </Typography>
        {!provider.available && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.2, textAlign: "left" }}
          >
            Not yet supported
          </Typography>
        )}
      </Stack>

      {!provider.available && (
        <Chip
          label="Coming soon"
          size="small"
          sx={{
            ml: "auto",
            fontWeight: 700,
            fontSize: "0.65rem",
            letterSpacing: 0.4,
            textTransform: "uppercase",
            bgcolor: alpha(theme.palette.warning.main, isDark ? 0.18 : 0.14),
            color: isDark
              ? theme.palette.warning.light
              : theme.palette.warning.dark,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
          }}
        />
      )}
    </Box>
  );
}

import { alpha, createTheme, responsiveFontSizes, type PaletteMode } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  const bodyFontStack = [
    '"Inter"',
    '"Segoe UI Variable Text"',
    '"Segoe UI"',
    '"SF Pro Text"',
    '"Roboto"',
    '"Noto Sans"',
    "Arial",
    "sans-serif",
  ].join(", ");
  const headingFontStack = [
    '"Inter"',
    '"Segoe UI Variable Display"',
    '"Segoe UI Variable Text"',
    '"Segoe UI"',
    '"SF Pro Display"',
    '"Roboto"',
    '"Noto Sans"',
    "Arial",
    "sans-serif",
  ].join(", ");

  const baseTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#7dd3fc" : "#0369a1",
        light: mode === "dark" ? "#bae6fd" : "#38bdf8",
        dark: mode === "dark" ? "#0ea5e9" : "#0f4c75",
      },
      secondary: {
        main: mode === "dark" ? "#f59e0b" : "#b45309",
      },
      background: {
        default: mode === "dark" ? "#09111d" : "#eef6fb",
        paper: mode === "dark" ? "#111d2f" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#f4f8fb" : "#0f172a",
        secondary: mode === "dark" ? "#bfd0e3" : "#475569",
      },
      divider: mode === "dark" ? "#24415f" : "#c8d9e6",
      success: {
        main: "#22c55e",
      },
      warning: {
        main: "#f59e0b",
      },
    },
    shape: {
      borderRadius: 5,
    },
    typography: {
      fontFamily: bodyFontStack,
      h1: {
        fontFamily: headingFontStack,
        fontWeight: 700,
      },
      h2: {
        fontFamily: headingFontStack,
        fontWeight: 700,
      },
      h3: {
        fontFamily: headingFontStack,
        fontWeight: 700,
      },
      h4: {
        fontFamily: headingFontStack,
        fontWeight: 700,
      },
      button: {
        textTransform: "none",
        fontWeight: 700,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 18,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.25 : 0.12)}`,
          }),
        },
      },
    },
  });

  return responsiveFontSizes(baseTheme);
}

"use strict";

import { useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";

import { HomePage } from "./pages/home";
import { SignInPage } from "./pages/signin";
import { TermsPage } from "./pages/agreements/terms";
import { PrivacyPage } from "./pages/agreements/privacy";
import { OauthRedirectPages } from "./pages/oauth-redirect";
import { ErrorPage } from "./pages/error";

import "./App.css";

import { createAppTheme } from "./components/create-app-theme";
import { ErrorBoundary } from "./components/error-boundary";

import { useSettings } from "./contexts/settings-context";

function App() {
  const { theme } = useSettings();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const mode = useMemo(() => {
    if (theme === "dark") return "dark";
    if (theme === "light") return "light";
    return prefersDarkMode ? "dark" : "light";
  }, [theme, prefersDarkMode]);

  const appTheme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <main>
        <ErrorBoundary
          title="App error"
          message="A page crashed while rendering. Try again or reload the app."
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignInPage />} />

            <Route path="/terms" element={<TermsPage />} />
            <Route path="/terms/:date" element={<TermsPage />} />

            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/privacy/:date" element={<PrivacyPage />} />

            <Route
              path="/oauth/redirect/:provider"
              element={<OauthRedirectPages />}
            />

            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<h1>404 - Not found</h1>} />
          </Routes>
        </ErrorBoundary>
      </main>
    </ThemeProvider>
  );
}

export default App;

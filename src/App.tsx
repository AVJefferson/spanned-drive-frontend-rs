"use strict";

import { useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";

import "./App.css";

import {
  HomePage,
  ErrorPage,
  SignInPage,
  TermsPage,
  PrivacyPage,
  OauthRedirectPages,
} from "./pages";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useSettings } from "./contexts/SettingsContext";
import { createAppTheme } from "./theme/create-app-theme";
import { HomeProviders } from "./pages/home/home-providers";

function App() {
  const { settings } = useSettings();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const mode = useMemo(() => {
    if (settings.theme === "dark") return "dark";
    if (settings.theme === "light") return "light";
    return prefersDarkMode ? "dark" : "light";
  }, [settings.theme, prefersDarkMode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main>
        <ErrorBoundary
          title="App error"
          message="A page crashed while rendering. Try again or reload the app."
        >
          <Routes>
            <Route
              path="/"
              element={
                <HomeProviders>
                  <HomePage />
                </HomeProviders>
              }
            />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/terms/:date" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/privacy/:date" element={<PrivacyPage />} />
            <Route path="/oauth/redirect/:provider" element={<OauthRedirectPages />} />
            <Route path="*" element={<h1>404 - Not found</h1>} />
          </Routes>
        </ErrorBoundary>
      </main>
    </ThemeProvider>
  );
}

export default App;

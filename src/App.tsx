"use strict";

import { useState, useEffect, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
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

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [themeSetting, setThemeSetting] = useState<string | null>(() =>
    localStorage.getItem("settings.theme"),
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setThemeSetting(localStorage.getItem("settings.theme"));
    };

    window.addEventListener("storage", handleStorageChange);
    // Listen for custom event in case it's changed programmatically in the same tab
    window.addEventListener("theme-changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("theme-changed", handleStorageChange);
    };
  }, []);

  const mode = useMemo(() => {
    if (themeSetting === "dark") return "dark";
    if (themeSetting === "light") return "light";
    return prefersDarkMode ? "dark" : "light";
  }, [themeSetting, prefersDarkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/terms/:date" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/privacy/:date" element={<PrivacyPage />} />
          <Route path="/oauth/redirect/:provider" element={<OauthRedirectPages />} />
          <Route path="*" element={<h1>404 - Not found</h1>} />
        </Routes>
      </main>
    </ThemeProvider>
  );
}

export default App;

"use strict";

import { Routes, Route } from "react-router-dom";

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
  return (
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
  );
}

export default App;

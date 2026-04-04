"use strict";

import { Routes, Route } from "react-router-dom";

import "./App.css";

import { HomePage, ErrorPage, SignInPage } from "./pages";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="*" element={<h1>404 - Not found</h1>} />
      </Routes>
    </main>
  );
}

export default App;

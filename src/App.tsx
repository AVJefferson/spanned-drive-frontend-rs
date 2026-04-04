"use strict";

import { useState, useEffect, use } from "react";
import { Routes, Route } from "react-router-dom";

import "./App.css";

import Home from "./pages/home";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<h1>404 - Not found</h1>} />
      </Routes>
    </main>
  );
}

export default App;

import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import PublicSelection from "./PublicSelection.jsx";

// публичная подборка для клиента: /?sel=<токен> — без входа в CRM
const selToken = new URLSearchParams(window.location.search).get("sel");
createRoot(document.getElementById("root")).render(selToken ? <PublicSelection token={selToken} /> : <App />);

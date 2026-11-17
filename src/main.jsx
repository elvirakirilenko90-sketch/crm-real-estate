import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import PublicSelection from "./PublicSelection.jsx";
import NbPlansJob from "./NbPlansJob.jsx";

// публичная подборка для клиента: /?sel=<токен> — без входа в CRM
const qs = new URLSearchParams(window.location.search);
const selToken = qs.get("sel");
// служебная обработка поквартирных планировок по разовому ключу: /?nbplans=<id ЖК>&job=<ключ>
const nbJob = qs.get("nbplans") && qs.get("job");
createRoot(document.getElementById("root")).render(selToken ? <PublicSelection token={selToken} />
  : nbJob ? <NbPlansJob sourceId={qs.get("nbplans")} job={qs.get("job")} dry={qs.get("dry") === "1"} force={qs.get("force") === "1"} /> : <App />);

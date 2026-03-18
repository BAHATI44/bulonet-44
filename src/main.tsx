import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preventFraming, disableContextMenu, disableDevShortcuts } from "./lib/security";

// Security layers - activate in production
if (import.meta.env.PROD) {
  preventFraming();
  disableContextMenu();
  disableDevShortcuts();
}

createRoot(document.getElementById("root")!).render(<App />);

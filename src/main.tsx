import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before first render to avoid flash
(() => {
  try {
    const prefs = JSON.parse(localStorage.getItem("carsgpt-preferences") || "{}");
    const theme = prefs.theme || "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
  } catch { /* use default light */ }
})();

createRoot(document.getElementById("root")!).render(<App />);

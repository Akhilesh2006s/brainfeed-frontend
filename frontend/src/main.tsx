import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initGoogleTag } from "@/lib/initGoogleTag";
import "./index.css";

initGoogleTag();

createRoot(document.getElementById("root")!).render(<App />);

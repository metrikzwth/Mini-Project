import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { initializeData } from './lib/data';

// Initialize mock data
initializeData();

createRoot(document.getElementById('root')!).render(<App />);

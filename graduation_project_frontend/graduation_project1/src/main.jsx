import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import { applySavedTheme } from "./hooks/useTheme.js";
import "./i18n";
// خط Cairo (ملفاته مع المشروع، ما بيحتاج إنترنت)
import "@fontsource-variable/cairo";
import "./index.css";

// الوضع الفاتح أو الداكن المحفوظ، قبل أول رسمة
applySavedTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
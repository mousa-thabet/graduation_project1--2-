import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

// ----- الوضع الفاتح والداكن (وضع واحد لكل الموقع) -----
// الألوان نفسها مكتوبة بـ index.css، وهون بس بنكتب data-study-theme على body وبنحفظ الاختيار
const MODE_KEY = "areatk-theme";

function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

// بنستدعيها مرة قبل ما ترسم React أي شي (main.jsx)، حتى ما تومض الصفحة بالوضع الغلط
export function applySavedTheme() {
  document.body.dataset.studyTheme = loadMode();
}

/**
 * الوضع الحالي وزر التبديل.
 * theme: "light" أو "dark"  •  isDark  •  toggleTheme()
 */
export function useTheme() {
  const [mode, setMode] = useState(loadMode);

  useEffect(() => {
    document.body.dataset.studyTheme = mode;
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  function toggleTheme() {
    const update = () => setMode((current) => (current === "light" ? "dark" : "light"));

    // انتقال ناعم بالمتصفحات اللي بتدعمه
    if (document.startViewTransition) document.startViewTransition(() => flushSync(update));
    else update();
  }

  return { theme: mode, isDark: mode === "dark", toggleTheme };
}
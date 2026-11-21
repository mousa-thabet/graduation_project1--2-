import { useEffect, useState } from "react";

/**
 * الوقت الحالي، ويتحدّث كل ثانية (للمؤقتات والعدّادات المعروضة).
 * isActive: false يوقف التحديث (مثلًا عندما لا نحتاجه)
 */
export function useNow(isActive = true) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return now;
}
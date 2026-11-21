import { useEffect, useState } from "react";

/**
 * عدّاد تنازلي بالثواني.
 * start(60) يبدأ العد، و secondsLeft يعطي الثواني المتبقية.
 */
export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setTimeout(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return {
    secondsLeft,
    isRunning: secondsLeft > 0,
    start: setSecondsLeft,
  };
}
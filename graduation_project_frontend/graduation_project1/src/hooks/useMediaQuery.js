import { useEffect, useState } from "react";

/**
 * هل الشاشة بتطابق شرط CSS معيّن؟ (مثل "(min-width: 1281px)")
 * بتتحدّث لحالها لما يتغيّر حجم الشاشة.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);

    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
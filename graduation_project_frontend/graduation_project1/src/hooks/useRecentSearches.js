import { useEffect, useState } from "react";

const STORAGE_KEY = "areatk-community-searches";
const MAX_ITEMS = 8;

function loadSearches() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return [];
}

/**
 * عمليات البحث الأخيرة (مثل يوتيوب): تظهر تحت مربع البحث قبل الكتابة.
 * الأحدث أولًا، بدون تكرار، وبحد أقصى 8.
 */
export function useRecentSearches() {
  const [searches, setSearches] = useState(loadSearches);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  }, [searches]);

  function add(query) {
    const value = query.trim();
    if (!value) return;

    setSearches((current) =>
      [value, ...current.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, MAX_ITEMS)
    );
  }

  function remove(query) {
    setSearches((current) => current.filter((item) => item !== query));
  }

  function clear() {
    setSearches([]);
  }

  return { searches, add, remove, clear };
}
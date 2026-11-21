import { useState } from "react";

/**
 * عرض قائمة طويلة على دفعات ("عرض المزيد") بدل ما نرسم ألف عنصر مرة وحدة.
 * resetKey: لما يتغير (بحث أو فلتر جديد) نرجع للدفعة الأولى
 * يرجع: { visible, remaining, hasMore, showMore }
 */
export function usePaged(items, resetKey, pageSize = 10) {
  const [state, setState] = useState({ key: resetKey, count: pageSize });
  // بحث أو فلتر جديد: نبدأ من أول دفعة (بدون effect)
  const count = state.key === resetKey ? state.count : pageSize;

  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    hasMore: items.length > count,
    showMore: () => setState({ key: resetKey, count: count + pageSize }),
  };
}
import { useEffect, useState } from "react";

const STORAGE_KEY = "areatk-drafts";

function loadDrafts(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

/**
 * مسودات المنشورات: نص (واستطلاع إن وُجد) تحفظه لتكمله لاحقًا.
 * الملفات المرفوعة لا تُحفظ في المسودة.
 * كل قسم له مسوداته: storageKey يحدد مكان الحفظ.
 */
export function useDrafts({ storageKey = STORAGE_KEY } = {}) {
  const [drafts, setDrafts] = useState(() => loadDrafts(storageKey));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(drafts));
  }, [drafts, storageKey]);

  // id: رقم المسودة عند تعديل مسودة قديمة (تنتقل لأول القائمة)
  // extra: معلومات إضافية (في التواصل: النوع، المجتمع، الفرع، الوسوم)
  function saveDraft({ id, text, poll, ...extra }) {
    const draft = { id: id ?? crypto.randomUUID(), text, poll: poll ?? null, ...extra, updatedAt: Date.now() };
    setDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)]);
  }

  function deleteDraft(id) {
    setDrafts((current) => current.filter((item) => item.id !== id));
  }

  return { drafts, saveDraft, deleteDraft };
}
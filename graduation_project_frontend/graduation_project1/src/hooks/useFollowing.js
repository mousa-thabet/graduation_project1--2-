import { useEffect, useState } from "react";
import { useStorageSync } from "./useSharedStorage.js";

// مفتاح واحد للمتابعة بالقسمين (ادرس معي والتواصل)
const STORAGE_KEY = "areatk-following";
// المفتاح القديم لمتابعات التواصل لما كانت منفصلة: بندمجه مرة وحدة وبنحذفه
const OLD_COMMUNITY_KEY = "areatk-community-following";

function readList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// متابعاتي: القائمة الموحّدة، ومعها متابعات التواصل القديمة (إن وُجدت) بدون تكرار
function loadFollowing() {
  return [...new Set([...readList(STORAGE_KEY), ...readList(OLD_COMMUNITY_KEY)])];
}

/**
 * الأشخاص الذين تتابعهم (محفوظة في المتصفح).
 * نفس القائمة بالقسمين: اللي بتتابعه بادرس معي بيبين إنك متابعه بالتواصل، والعكس.
 * أي تغيير بتبويب ثاني بيوصل هون فورًا.
 * لاحقًا: القائمة بتيجي من السيرفر (حساب واحد للقسمين).
 */
export function useFollowing() {
  const [following, setFollowing] = useState(loadFollowing);

  // الحفظ بعد كل تغيير، وبعد ما ينحفظ الدمج بنحذف المفتاح القديم
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(following));
    localStorage.removeItem(OLD_COMMUNITY_KEY);
  }, [following]);

  // تابعت أو لغيت المتابعة بتبويب ثاني
  useStorageSync(STORAGE_KEY, () => setFollowing(loadFollowing()));

  function toggleFollow(personId) {
    setFollowing((current) =>
      current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId]
    );
  }

  return { following, isFollowing: (personId) => following.includes(personId), toggleFollow };
}
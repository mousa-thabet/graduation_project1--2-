import { useEffect, useState } from "react";
import { CURRENT_USER } from "../data/currentUser.js";
import { deleteMedia, getMedia, saveMedia } from "../utils/mediaStore.js";

// كل حساب إله نسخته (بالـ handle)، مثل useProfile
const storageKey = (handle) => `areatk-community-profile:${handle}`;
// رقم غلاف التواصل في IndexedDB
const coverId = (handle) => `community-profile-cover:${handle}`;

function loadProfile(handle) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(handle)));
    if (saved) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  return {
    headline: "",
    bio: "",
    university: "",
    website: "",
    joinedAt: Date.now(),
    hasCover: false,
    pinnedPostId: null,
  };
}

/**
 * حسابي في التواصل: التخصص والنبذة والجامعة والموقع والغلاف والمنشور المثبّت.
 * الاسم والصورة الشخصية مشتركان مع ادرس معي (من useProfile)، والباقي خاص بالتواصل.
 */
export function useCommunityProfile() {
  // الحساب اللي فتح الصفحة (القسم بيتركّب من جديد بعد كل تسجيل دخول)
  const [handle] = useState(() => CURRENT_USER.handle);
  const [profile, setProfile] = useState(() => loadProfile(handle));
  const [cover, setCover] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey(handle), JSON.stringify(profile));
  }, [handle, profile]);

  // قراءة الغلاف من IndexedDB مرة واحدة عند الفتح
  useEffect(() => {
    let isCancelled = false;
    let url = null;

    getMedia(coverId(handle))
      .then((file) => {
        if (!file || isCancelled) return;
        url = URL.createObjectURL(file);
        setCover(url);
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [handle]);

  // fields: { headline, bio, university, website }
  // newCover: ملف جديد، أو null للحذف، أو undefined لتركه كما هو
  function updateProfile({ fields, cover: newCover }) {
    if (newCover !== undefined) {
      if (cover) URL.revokeObjectURL(cover);
      setCover(newCover ? URL.createObjectURL(newCover) : null);
      if (newCover) saveMedia(coverId(handle), newCover);
      else deleteMedia(coverId(handle));
    }

    setProfile((current) => ({
      ...current,
      ...fields,
      ...(newCover !== undefined && { hasCover: Boolean(newCover) }),
    }));
  }

  // منشور واحد فقط يُثبَّت، والضغط مرة ثانية يلغي التثبيت
  function togglePin(postId) {
    setProfile((current) => ({ ...current, pinnedPostId: current.pinnedPostId === postId ? null : postId }));
  }

  return { profile, cover, updateProfile, togglePin };
}
import { useEffect, useState } from "react";
import { CURRENT_USER } from "../data/currentUser.js";
import { deleteMedia, getMedia, saveMedia } from "../utils/mediaStore.js";

// كل حساب إله نسخته (بالـ handle)، فإذا دخل حدا ثاني من نفس المتصفح بيبلّش بحساب جديد باسمه
const storageKey = (handle) => `areatk-profile:${handle}`;

// أرقام صورتي الحساب في IndexedDB (الصور نفسها كبيرة فلا تُحفظ في localStorage)
const avatarId = (handle) => `profile-avatar:${handle}`;
const coverId = (handle) => `profile-cover:${handle}`;

function loadProfile(handle) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(handle)));
    if (saved) return saved;
  } catch {
    // بيانات تالفة: نبدأ من جديد
  }

  // حساب جديد: الاسم هو اسم الحساب اللي سجّل فيه (وبيقدر يغيّره من "تعديل الحساب")
  return {
    name: CURRENT_USER.name,
    bio: "",
    university: "",
    location: "",
    website: "",
    joinedAt: Date.now(),
    hasAvatar: false,
    hasCover: false,
    pinnedPostId: null,
  };
}

/**
 * حسابي: الاسم والنبذة والمعلومات، الصورة الشخصية والغلاف، والمنشور المثبّت.
 * يُستدعى مرة واحدة في StudyLayout، فأي تعديل يظهر فورًا في القائمة والمنشورات وصفحة الحساب.
 */
export function useProfile() {
  // الحساب اللي فتح الصفحة (القسم بيتركّب من جديد بعد كل تسجيل دخول)
  const [handle] = useState(() => CURRENT_USER.handle);
  const [profile, setProfile] = useState(() => loadProfile(handle));
  // روابط مؤقتة (blob) لعرض الصورتين
  const [images, setImages] = useState({ avatar: null, cover: null });

  useEffect(() => {
    localStorage.setItem(storageKey(handle), JSON.stringify(profile));
  }, [handle, profile]);

  // قراءة الصورتين من IndexedDB مرة واحدة عند الفتح
  useEffect(() => {
    let isCancelled = false;
    const urls = [];

    [
      ["avatar", avatarId(handle)],
      ["cover", coverId(handle)],
    ].forEach(async ([key, id]) => {
      const file = await getMedia(id).catch(() => null);
      if (!file || isCancelled) return;

      const url = URL.createObjectURL(file);
      urls.push(url);
      setImages((current) => ({ ...current, [key]: url }));
    });

    return () => {
      isCancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [handle]);

  // تغيير صورة (file) أو حذفها (null)
  function setImage(key, id, file) {
    if (images[key]) URL.revokeObjectURL(images[key]);
    const url = file ? URL.createObjectURL(file) : null;
    setImages((current) => ({ ...current, [key]: url }));

    if (file) saveMedia(id, file);
    else deleteMedia(id);
  }

  // fields: { name, bio, university, location, website }
  // avatar / cover: ملف جديد، أو null للحذف، أو undefined لتركها كما هي
  function updateProfile({ fields, avatar, cover }) {
    if (avatar !== undefined) setImage("avatar", avatarId(handle), avatar);
    if (cover !== undefined) setImage("cover", coverId(handle), cover);

    setProfile((current) => ({
      ...current,
      ...fields,
      ...(avatar !== undefined && { hasAvatar: Boolean(avatar) }),
      ...(cover !== undefined && { hasCover: Boolean(cover) }),
    }));
  }

  // منشور واحد فقط يُثبَّت، والضغط مرة ثانية يلغي التثبيت
  function togglePin(postId) {
    setProfile((current) => ({ ...current, pinnedPostId: current.pinnedPostId === postId ? null : postId }));
  }

  // أنا كشخص (بنفس شكل كتّاب المنشورات): يُستخدم في المنشورات والتعليقات والقائمة
  const me = {
    id: CURRENT_USER.id,
    handle,
    name: profile.name,
    avatar: images.avatar,
  };

  return { profile, me, cover: images.cover, updateProfile, togglePin };
}
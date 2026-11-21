import { startTransition, useEffect, useState } from "react";
import { useNavigate } from "react-router";

// ----- تسجيل الدخول -----
// الحساب بينحفظ بـ localStorage، فبيضل مسجّل حتى لو سكّر المتصفح ورجع (مثل المواقع الكبيرة)
// لاحقًا: السيرفر بيرجّع token، وبنحفظه بدل اسم الحساب
export const AUTH_KEY = "areatk-auth";
// حدث خاص بنفس التبويب (حدث storage بيوصل للتبويبات الثانية بس)
const AUTH_EVENT = "areatk-auth-change";
// جلسة الأدمن (نفس المفتاح اللي بـ useAdmin.js): تسجيل الخروج بيمسحها كمان
const ADMIN_SESSION_KEY = "areatk-admin-session";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    // بيانات تالفة: كأنه مش مسجّل
    return null;
  }
}

function notify() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/**
 * حالة تسجيل الدخول بكل الموقع.
 * user: { account, loggedInAt } أو null  •  login(account)  •  logout(): بيطلع وبيرجع على الرئيسية
 * أي دخول أو خروج (بهاد التبويب أو بغيره) بيوصل لكل الصفحات اللي بتستخدم useAuth.
 */
export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    function handleChange() {
      setUser(readUser());
    }

    window.addEventListener("storage", handleChange);
    window.addEventListener(AUTH_EVENT, handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(AUTH_EVENT, handleChange);
    };
  }, []);

  function login(account) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ account: account.trim(), loggedInAt: Date.now() }));
    notify();
  }

  // تسجيل الخروج: الحساب وجلسة الأدمن مع بعض، وبعدين الرئيسية.
  // startTransition: الخروج والانتقال بيصيروا برسمة وحدة،
  // وإلا الحماية (RequireAuth) بتلحق تشوف "مش مسجّل" وهو لسا بالقسم فبتوديه على صفحة الدخول
  function logout() {
    startTransition(() => {
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      notify();
      navigate("/");
    });
  }

  return { user, isLoggedIn: user !== null, login, logout };
}
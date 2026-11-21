import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";

/**
 * حماية الأقسام: بدون تسجيل دخول ← صفحة تسجيل الدخول.
 * بنبعت الصفحة اللي كان رايح عليها (from)، فبعد الدخول بيرجع عليها مباشرة.
 */
function RequireAuth() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  return <Outlet />;
}

export default RequireAuth;
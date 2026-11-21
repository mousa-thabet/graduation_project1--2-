import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Navbar from "../../components/Navbar/Navbar.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton.jsx";

/**
 * قالب الصفحات العامة: القائمة فوق، الذيل تحت، وزر الواتساب العائم للدعم الفني.
 */
function MainLayout() {
  const { pathname, hash } = useLocation();

  // صفحة جديدة بتبدأ من فوق (إلا إذا الرابط لقسم معيّن مثل /#study)
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default MainLayout;
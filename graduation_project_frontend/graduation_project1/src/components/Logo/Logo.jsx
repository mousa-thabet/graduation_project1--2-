import { Link } from "react-router";
import "./Logo.css";

// اسم المنصة كنص (بدون صورة)، وبيفتح أول صفحة
function Logo() {
  return (
    <Link to="/" className="logo" dir="ltr">
      AreaTk
    </Link>
  );
}

export default Logo;
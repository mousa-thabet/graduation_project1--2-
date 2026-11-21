import { Link } from "react-router";
import Icon from "../Icon/Icon.jsx";
import "./BackLink.css";

function BackLink({ to, children }) {
  return (
    <Link to={to} className="back-link">
      <Icon name="arrowRight" />
      {children}
    </Link>
  );
}

export default BackLink;
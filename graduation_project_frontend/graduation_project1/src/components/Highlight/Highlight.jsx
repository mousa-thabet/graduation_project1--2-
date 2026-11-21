import { highlightParts } from "../../utils/search.js";
import "./Highlight.css";

/**
 * نص مع تلوين الكلمات المطابقة للبحث (مثل يوتيوب).
 * text: النص  •  query: ما كتبه المستخدم في البحث
 */
function Highlight({ text, query }) {
  return highlightParts(text, query).map((part, index) =>
    part.isMatch ? (
      <mark key={index} className="highlight">
        {part.text}
      </mark>
    ) : (
      part.text
    )
  );
}

export default Highlight;
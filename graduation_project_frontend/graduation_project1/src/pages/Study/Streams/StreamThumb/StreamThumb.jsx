import Icon from "../../../../components/Icon/Icon.jsx";
import "./StreamThumb.css";

// لقطة من الفيديو عند ثانية مختلفة لكل بث (حتى لا تتشابه الواجهات)
function frameTime(id) {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return 1 + (sum % 3);
}

/**
 * صورة واجهة البث (مثل يوتيوب):
 * 1) الصورة التي اختارها صاحب البث  2) أو لقطة من الفيديو  3) أو غلاف افتراضي.
 * stream: البث أو التسجيل  •  children: الشارات فوق الصورة (مباشر، المدة...)
 */
function StreamThumb({ stream, className = "", children }) {
  const video = stream.video ?? stream.src;

  return (
    <div className={`stream-thumb ${className}`}>
      {stream.thumbnail ? (
        <img className="stream-thumb__media" src={stream.thumbnail} alt="" loading="lazy" />
      ) : video ? (
        // ‎#t=ثواني: المتصفح يعرض الإطار عند هذه الثانية بدون تشغيل الفيديو
        <video
          className="stream-thumb__media"
          src={`${video}#t=${frameTime(stream.id)}`}
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : (
        <span className="stream-thumb__empty" aria-hidden="true">
          <Icon name="radio" size={40} strokeWidth={1.5} />
        </span>
      )}
      {children}
    </div>
  );
}

export default StreamThumb;
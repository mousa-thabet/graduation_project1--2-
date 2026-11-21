import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../../../components/Icon/Icon.jsx";
import { getSoundName } from "../../../../utils/sounds.js";
import "./SoundMixer.css";

/**
 * خلاط الأصوات: تشغيل أكثر من صوت معًا، ولكل صوت شريط قوة.
 * mixer: من useSoundMixer  •  sounds: الأصوات اللي بتنعرض (بجلستي: بس اللي نقلته من مكتبتي)
 */
function SoundMixer({ mixer, sounds = mixer.sounds }) {
  const { t } = useTranslation();

  return (
    <section className="session-card">
      <header className="session-card__head">
        <div>
          <h2 className="session-card__title">{t("studyApp.session.sounds.title")}</h2>
          <p className="session-card__hint">{t("studyApp.session.sounds.hint")}</p>
        </div>

        <div className="session-card__actions">
          {/* أصوات شغالة: كتم أو إيقاف الكل */}
          {mixer.activeCount > 0 && (
            <>
              <button
                type="button"
                className="session-card__action is-neutral"
                aria-pressed={mixer.isMuted}
                onClick={mixer.toggleMute}
              >
                <Icon name="volume" size={14} />
                {mixer.isMuted ? t("studyApp.session.sounds.unmute") : t("studyApp.session.sounds.mute")}
              </button>
              <button type="button" className="session-card__action" onClick={mixer.stopAll}>
                {t("studyApp.session.sounds.stopAll")}
              </button>
            </>
          )}

          {/* إدارة أصوات جلستي من مكتبتي */}
          <Link to="/study/library?tab=mine" className="session-card__action is-neutral">
            {t("library.session.manage")}
          </Link>
        </div>
      </header>

      {/* ما في أصوات بجلستي: رابط لمكتبتي */}
      {sounds.length === 0 && (
        <p className="session-empty">
          {t("library.session.noSounds")}{" "}
          <Link to="/study/library?tab=mine">{t("library.session.open")}</Link>
        </p>
      )}

      <ul className="sound-mixer">
        {sounds.map((sound) => {
          const isPlaying = mixer.isPlaying(sound.id);
          const name = getSoundName(sound, t);

          return (
            <li key={sound.id} className={`sound-mixer__item ${isPlaying ? "is-playing" : ""}`}>
              <button
                type="button"
                className="sound-mixer__toggle"
                aria-pressed={isPlaying}
                onClick={() => mixer.toggle(sound)}
              >
                <span className="sound-mixer__icon">
                  <Icon name={sound.icon} size={20} />
                </span>
                <span className="sound-mixer__name" dir="auto">
                  {name}
                </span>

                {/* أعمدة صغيرة تتحرك أثناء التشغيل */}
                {isPlaying && (
                  <span className="sound-mixer__bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </button>

              {/* شريط القوة يظهر للصوت المشغّل فقط */}
              {isPlaying && (
                <input
                  type="range"
                  className="sound-mixer__volume"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mixer.volumes[sound.id]}
                  aria-label={t("studyApp.session.sounds.volume", { name })}
                  onChange={(event) => mixer.setVolume(sound.id, Number(event.target.value))}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default SoundMixer;
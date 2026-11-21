import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import { SceneBackground } from "../Session/SessionScene/SessionScene.jsx";
import { getSceneName } from "../../../data/sessionScenes.js";
import { getSoundName } from "../../../utils/sounds.js";
import "./MyLibrary.css";

/**
 * زر "أضف لمكتبتي" (أو "بمكتبتي" إذا مضاف) جنب أي صوت أو خلفية بالمكتبة.
 * kind: "sounds" أو "scenes"  •  name: اسم العنصر (لقارئ الشاشة)
 */
export function SaveButton({ myLibrary, kind, id, name }) {
  const { t } = useTranslation();
  const isSaved = myLibrary.has(kind, id);

  return (
    <button
      type="button"
      className={`library-save ${isSaved ? "is-saved" : ""}`}
      aria-pressed={isSaved}
      aria-label={t(isSaved ? "library.unsaveLabel" : "library.saveLabel", { name })}
      title={t(isSaved ? "library.unsaveLabel" : "library.saveLabel", { name })}
      onClick={() => myLibrary.toggle(kind, id)}
    >
      <Icon name={isSaved ? "check" : "plus"} size={15} strokeWidth={2.5} />
      {t(isSaved ? "library.saved" : "library.save")}
    </button>
  );
}

/**
 * زر النقل لجلستي: "انقل لجلستي" ← "بجلستي" (والضغط مرة ثانية بيشيله من الجلسة).
 */
function SessionButton({ myLibrary, kind, id, name }) {
  const { t } = useTranslation();
  const isInSession = myLibrary.inSession(kind, id);

  return (
    <button
      type="button"
      className={`library-move ${isInSession ? "is-moved" : ""}`}
      aria-pressed={isInSession}
      aria-label={t(isInSession ? "library.mine.removeFromSession" : "library.mine.toSessionLabel", { name })}
      title={t(isInSession ? "library.mine.removeFromSession" : "library.mine.toSessionLabel", { name })}
      onClick={() => myLibrary.toggleSession(kind, id)}
    >
      {/* السهم بينقلب بالعربي (من اليمين لليسار) */}
      <Icon
        name={isInSession ? "check" : "arrowRight"}
        size={15}
        strokeWidth={2.5}
        className={isInSession ? undefined : "library-move__icon"}
      />
      {t(isInSession ? "library.mine.inSession" : "library.mine.toSession")}
    </button>
  );
}

// زر "شيل من مكتبتي"
function RemoveButton({ myLibrary, kind, id, name }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="library-remove"
      aria-label={t("library.mine.removeLabel", { name })}
      title={t("library.mine.removeLabel", { name })}
      onClick={() => myLibrary.toggle(kind, id)}
    >
      <Icon name="x" size={16} />
    </button>
  );
}

/**
 * تبويب "مكتبتي": الأصوات والخلفيات اللي اخترتها، وزر لنقل كل وحدة (أو الكل) لجلستي.
 * جلستي بتعرض بس اللي نقلته من هون.
 * sounds / scenes: كل أصوات وخلفيات المكتبة (بنختار منها اللي بمكتبتي)  •  mixer: لتجربة الصوت
 */
function MyLibraryTab({ myLibrary, sounds, scenes, mixer, activeSceneId }) {
  const { t } = useTranslation();

  // بترتيب الإضافة، والعنصر اللي انحذف من المكتبة ما بيبين
  const mySounds = myLibrary.sounds.map((id) => sounds.find((sound) => sound.id === id)).filter(Boolean);
  const myScenes = myLibrary.scenes.map((id) => scenes.find((scene) => scene.id === id)).filter(Boolean);

  const total = mySounds.length + myScenes.length;
  const movedCount =
    mySounds.filter((sound) => myLibrary.inSession("sounds", sound.id)).length +
    myScenes.filter((scene) => myLibrary.inSession("scenes", scene.id)).length;

  return (
    <section className="library-section">
      <p className="library-hint">{t("library.mine.hint")}</p>

      {/* كم عنصر بجلستي، ونقل الكل */}
      {total > 0 && (
        <div className="my-library__bar">
          <span>{t("library.mine.count", { moved: movedCount, total })}</span>
          <button
            type="button"
            className="library-move"
            disabled={movedCount === total}
            onClick={myLibrary.moveAllToSession}
          >
            <Icon
              name={movedCount === total ? "check" : "arrowRight"}
              size={15}
              strokeWidth={2.5}
              className={movedCount === total ? undefined : "library-move__icon"}
            />
            {t(movedCount === total ? "library.mine.allMoved" : "library.mine.moveAll")}
          </button>
        </div>
      )}

      {/* الأصوات */}
      <h2 className="library-group">{t("library.mine.sounds", { count: mySounds.length })}</h2>
      {mySounds.length > 0 ? (
        <ul className="library-sounds">
          {mySounds.map((sound) => {
            const name = getSoundName(sound, t);
            const isPlaying = mixer.isPlaying(sound.id);

            return (
              <li key={sound.id} className={`library-sound my-library__sound ${isPlaying ? "is-playing" : ""}`}>
                <span className="library-sound__icon">
                  <Icon name={sound.icon} size={20} />
                </span>
                <span className="library-sound__text">
                  <strong dir="auto">{name}</strong>
                </span>
                <div className="my-library__actions">
                  <button
                    type="button"
                    className="library-sound__play"
                    aria-pressed={isPlaying}
                    onClick={() => mixer.toggle(sound)}
                  >
                    <Icon name={isPlaying ? "pause" : "play"} size={16} strokeWidth={2.5} />
                    {t(isPlaying ? "studyApp.library.stop" : "studyApp.library.try")}
                  </button>
                  <SessionButton myLibrary={myLibrary} kind="sounds" id={sound.id} name={name} />
                  <RemoveButton myLibrary={myLibrary} kind="sounds" id={sound.id} name={name} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="library-empty">
          {t("library.mine.emptySounds")}{" "}
          <Link to="/study/library?tab=sounds">{t("library.mine.browseSounds")}</Link>
        </p>
      )}

      {/* الخلفيات */}
      <h2 className="library-group">{t("library.mine.scenes", { count: myScenes.length })}</h2>
      {myScenes.length > 0 ? (
        <ul className="scene-grid">
          {myScenes.map((scene) => {
            const name = getSceneName(scene, t);
            const isActive = activeSceneId === scene.id && myLibrary.inSession("scenes", scene.id);

            return (
              <li key={scene.id} className={`scene-card ${isActive ? "is-active" : ""}`}>
                <span className="scene-card__preview">
                  <SceneBackground scene={scene} />
                  {isActive && (
                    <span className="scene-card__badge">
                      <Icon name="check" size={12} strokeWidth={2.5} />
                      {t("studyApp.library.sceneActive")}
                    </span>
                  )}
                </span>
                <div className="scene-card__info">
                  <strong dir="auto">{name}</strong>
                  <div className="my-library__actions">
                    <SessionButton myLibrary={myLibrary} kind="scenes" id={scene.id} name={name} />
                    <RemoveButton myLibrary={myLibrary} kind="scenes" id={scene.id} name={name} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="library-empty">
          {t("library.mine.emptyScenes")}{" "}
          <Link to="/study/library?tab=scenes">{t("library.mine.browseScenes")}</Link>
        </p>
      )}

      <Link to="/study/session" className="library-link">
        {t("studyApp.library.openSession")}
        <Icon name="arrowRight" size={16} className="library-link__arrow" />
      </Link>
    </section>
  );
}

export default MyLibraryTab;
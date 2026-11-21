import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../StudyHeader/StudyHeader.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import StreamCard from "./StreamCard/StreamCard.jsx";
import GoLiveDialog from "./GoLiveDialog/GoLiveDialog.jsx";
import { useNow } from "../../../hooks/useNow.js";
import "./Streams.css";

const TABS = ["live", "recorded"];

/**
 * صفحة البثوث (للدراسة فقط): المباشرة الآن بمؤقتها المشترك، والمسجّلة، وزر "ابدأ بث".
 * من زر "فيديو بث مباشر" بصندوق المنشورات (state.goLive): نافذة "ابدأ بث" بتفتح مباشرة،
 * وإذا عندي بث شغال بيرجعني عليه.
 */
function Streams() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { streams, profile } = useOutletContext();
  const [tab, setTab] = useState("live");
  const wantsToGoLive = Boolean(location.state?.goLive);
  const [isStarting, setIsStarting] = useState(() => wantsToGoLive && !streams.activeRoom?.isMine);
  const now = useNow(tab === "live");

  const myLive = streams.activeRoom?.isMine ? streams.activeRoom : null;
  const list = tab === "live" ? streams.rooms : [...streams.recordings].sort((a, b) => b.endedAt - a.endedAt);

  // طلب "ابدأ بث" من صندوق المنشورات: بثي الشغال (إن وُجد)، وإلا بنمسح الطلب حتى ما يرجع مع التحديث
  useEffect(() => {
    if (!wantsToGoLive) return;

    if (myLive) navigate(`/study/streams/live/${myLive.id}`, { replace: true });
    else navigate(".", { replace: true, state: null });
  }, [wantsToGoLive, myLive, navigate]);

  function handleStart(options) {
    const roomId = streams.goLive(options, profile.me);
    setIsStarting(false);
    navigate(`/study/streams/live/${roomId}`);
  }

  return (
    <>
      <StudyHeader title={t("studyApp.nav.streams")}>
        <div className="study-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className="study-tabs__tab"
              onClick={() => setTab(item)}
            >
              {t(`studyApp.streams.tabs.${item}`)}
              {item === "live" && <span className="streams-count">{streams.rooms.length}</span>}
            </button>
          ))}
        </div>
      </StudyHeader>

      {/* افتح بثك، أو ارجع لبثك الشغال */}
      <section className={`streams-hero ${myLive ? "is-live" : ""}`}>
        <span className="streams-hero__icon">
          <Icon name="radio" size={24} />
        </span>
        <div className="streams-hero__text">
          <strong>{myLive ? t("studyApp.streams.hero.liveTitle") : t("studyApp.streams.hero.title")}</strong>
          <span>{myLive ? myLive.title : t("studyApp.streams.hero.text")}</span>
        </div>
        {myLive ? (
          <Link to={`/study/streams/live/${myLive.id}`} className="streams-hero__button">
            {t("studyApp.streams.hero.back")}
          </Link>
        ) : (
          <button type="button" className="streams-hero__button" onClick={() => setIsStarting(true)}>
            <span className="streams-hero__dot" aria-hidden="true" />
            {t("studyApp.streams.hero.button")}
          </button>
        )}
      </section>

      {list.length > 0 ? (
        <div className="stream-grid">
          {list.map((item) => (
            <StreamCard key={item.id} stream={item} isLive={tab === "live"} now={now} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={tab === "live" ? "radio" : "film"}
          title={t(`studyApp.streams.empty.${tab}`)}
          text={t(`studyApp.streams.empty.${tab}Text`)}
        />
      )}

      {isStarting && <GoLiveDialog onStart={handleStart} onClose={() => setIsStarting(false)} />}
    </>
  );
}

export default Streams;
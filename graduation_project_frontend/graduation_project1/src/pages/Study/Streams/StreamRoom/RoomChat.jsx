import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../components/Icon/Icon.jsx";
import Avatar from "../../../../components/Avatar/Avatar.jsx";
import { formatDuration } from "../../../../utils/streams.js";

const MAX_MESSAGE = 200;

/**
 * دردشة البث: تنفتح وقت الاستراحة فقط، ووقت التركيز تُقفل حتى لا تشتت أحدًا.
 * isOpen: الاستراحة الآن  •  secondsToOpen: الوقت الباقي حتى تنفتح
 */
function RoomChat({ messages, isOpen, secondsToOpen, onSend }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const listRef = useRef(null);

  // النزول لآخر رسالة كلما وصلت رسالة جديدة
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!isOpen || text.trim() === "") return;

    onSend(text.trim());
    setText("");
  }

  return (
    <div className="room-chat">
      <ul ref={listRef} className="room-chat__list" aria-live="polite">
        {messages.length === 0 && <li className="room-chat__empty">{t("studyApp.streams.room.chatEmpty")}</li>}

        {messages.map((message) => (
          <li key={message.id} className={`room-message ${message.isMine ? "is-mine" : ""}`}>
            <span className="room-message__avatar" aria-hidden="true">
              <Avatar person={message.author} />
            </span>
            <div className="room-message__body">
              <strong dir="auto">{message.author.name}</strong>
              <p>{message.text}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* وقت التركيز: الدردشة مقفلة مع العدّ التنازلي */}
      {!isOpen && (
        <div className="room-chat__locked">
          <Icon name="lock" size={16} />
          <span>{t("studyApp.streams.room.chatLocked")}</span>
          <span className="room-chat__opens">
            {t("studyApp.streams.room.chatOpensIn")} <bdi dir="ltr">{formatDuration(secondsToOpen)}</bdi>
          </span>
        </div>
      )}

      <form className="room-chat__form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          maxLength={MAX_MESSAGE}
          disabled={!isOpen}
          placeholder={t("studyApp.streams.room.chatPlaceholder")}
          aria-label={t("studyApp.streams.room.chatPlaceholder")}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          aria-label={t("studyApp.streams.room.send")}
          disabled={!isOpen || text.trim() === ""}
        >
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  );
}

export default RoomChat;
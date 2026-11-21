import { useTranslation } from "react-i18next";

/**
 * قائمة الأشخاص التي تظهر عند كتابة @ في المنشور.
 * activeIndex: الشخص المحدد بالأسهم، onSelect: اختيار شخص
 */
function MentionMenu({ id, people, activeIndex, onSelect }) {
  const { t } = useTranslation();

  return (
    <ul id={id} className="mention-menu" role="listbox" aria-label={t("studyApp.composer.mentionLabel")}>
      {people.map((person, index) => (
        <li
          key={person.id}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          className="mention-menu__item"
          // mouseDown بدل click حتى لا يفقد مربع النص التركيز
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(person);
          }}
        >
          <span className="mention-menu__avatar" aria-hidden="true">
            {person.name.charAt(0)}
          </span>
          <span className="mention-menu__text">
            <span className="mention-menu__name">{person.name}</span>
            <span className="mention-menu__handle" dir="ltr">
              @{person.handle}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default MentionMenu;

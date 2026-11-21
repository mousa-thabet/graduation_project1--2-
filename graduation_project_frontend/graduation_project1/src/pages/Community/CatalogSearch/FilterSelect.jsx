import { useEffect, useId, useRef, useState } from "react";
import Icon from "../../../components/Icon/Icon.jsx";

/**
 * قائمة منسدلة للفلاتر (بدل الأزرار اللي بتتمرّر أفقيًا).
 * label: اسم الفلتر (المجتمع، الفرع، الترتيب)  •  icon: أيقونة جنب الاسم
 * options: [{ value, label, color?, count? }]  •  value / onChange: الاختيار
 * disabled: معطّل (مثل الترتيب وقت البحث)
 * بتنفتح بالضغط، وبتتسكّر بـ Esc أو الضغط برا، والأسهم بتتنقل بين الخيارات.
 */
function FilterSelect({ label, icon, options, value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);
  const listId = useId();

  const selected = options.find((option) => option.value === value) ?? options[0];
  const isFiltered = value !== options[0]?.value;

  // الضغط برا القائمة بيسكّرها
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // لما تنفتح: التركيز على الخيار المختار
  useEffect(() => {
    if (!isOpen) return;
    const index = Math.max(0, options.findIndex((option) => option.value === value));
    optionRefs.current[index]?.focus();
  }, [isOpen, options, value]);

  function close() {
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function choose(nextValue) {
    onChange(nextValue);
    close();
  }

  function handleKeyDown(event, index) {
    const last = options.length - 1;
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: last };

    if (event.key in moves) {
      event.preventDefault();
      optionRefs.current[Math.min(last, Math.max(0, moves[event.key]))]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[index].value);
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`filter-select ${isFiltered ? "is-filtered" : ""}`} style={{ "--track": selected?.color }}>
      <button
        ref={buttonRef}
        type="button"
        className="filter-select__button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {icon && <Icon name={icon} size={15} />}
        <span className="filter-select__label">{label}</span>
        <span className="filter-select__value">
          {selected?.color && <span className="filter-select__dot" aria-hidden="true" />}
          {selected?.label}
        </span>
        <Icon name="chevronDown" size={16} className="filter-select__chevron" />
      </button>

      {isOpen && (
        <ul id={listId} className="filter-select__menu" role="listbox" aria-label={label}>
          {options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <li
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                className="filter-select__option"
                style={{ "--track": option.color }}
                onClick={() => choose(option.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {option.color ? (
                  <span className="filter-select__dot" aria-hidden="true" />
                ) : (
                  <span className="filter-select__dot is-empty" aria-hidden="true" />
                )}
                <span className="filter-select__option-label">{option.label}</span>
                {option.count !== undefined && <span className="filter-select__count">{option.count}</span>}
                <span className="filter-select__check" aria-hidden="true">
                  {isSelected && <Icon name="check" size={15} strokeWidth={2.5} />}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default FilterSelect;
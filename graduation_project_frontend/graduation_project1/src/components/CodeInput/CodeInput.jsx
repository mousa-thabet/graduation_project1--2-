import { useRef } from "react";
import { useTranslation } from "react-i18next";
import "./CodeInput.css";

/**
 * حقل رمز التحقق: خانة مستقلة لكل رقم.
 * - value مصفوفة أرقام، مثل ["1", "2", "", "", "", ""].
 * - ينتقل المؤشر تلقائيًا إلى الخانة التالية بعد كتابة الرقم.
 * - زر الحذف في خانة فارغة يرجع إلى الخانة السابقة.
 * - يدعم لصق الرمز كاملًا دفعة واحدة.
 * - ref يشير إلى الخانة الأولى حتى تستطيع الصفحة التركيز عليها.
 */
function CodeInput({ value, onChange, onComplete, error, disabled, ref }) {
  const { t } = useTranslation();
  const inputsRef = useRef([]);
  const length = value.length;

  function focusBox(index) {
    const box = inputsRef.current[Math.max(0, Math.min(index, length - 1))];
    box?.focus();
    box?.select();
  }

  // كتابة رقم أو عدة أرقام ابتداءً من خانة معيّنة
  function fillFrom(startIndex, newDigits) {
    const nextValue = [...value];

    newDigits.split("").forEach((digit, offset) => {
      if (startIndex + offset < length) nextValue[startIndex + offset] = digit;
    });

    onChange(nextValue);
    focusBox(startIndex + newDigits.length);

    // اكتمل الرمز: نبلغ الصفحة لتتحقق منه مباشرة
    if (nextValue.every((digit) => digit !== "")) {
      onComplete?.(nextValue.join(""));
    }
  }

  function handleChange(event, index) {
    // نقبل الأرقام فقط
    let typed = event.target.value.replace(/\D/g, "");
    if (typed === "") return;

    // الخانة كانت ممتلئة: نحذف الرقم القديم ونبقي الجديد
    if (value[index] && typed.length === 2) {
      typed = typed.replace(value[index], "");
    }

    fillFrom(index, typed);
  }

  function handleKeyDown(event, index) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const nextValue = [...value];

      if (value[index]) {
        nextValue[index] = "";
      } else if (index > 0) {
        nextValue[index - 1] = "";
        focusBox(index - 1);
      }

      onChange(nextValue);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(event, index) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");

    if (pasted) fillFrom(index, pasted.slice(0, length - index));
  }

  return (
    <div
      className={`code-input ${error ? "has-error" : ""}`}
      dir="ltr"
      role="group"
      aria-label={t("forgot.codeLabel")}
    >
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
            if (index === 0 && ref) ref.current = element;
          }}
          className={`code-input__box ${digit ? "is-filled" : ""}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={t("forgot.digitLabel", { index: index + 1 })}
          aria-invalid={Boolean(error)}
          onChange={(event) => handleChange(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => handlePaste(event, index)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}

export default CodeInput;
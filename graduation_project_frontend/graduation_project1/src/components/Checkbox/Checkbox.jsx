import Icon from "../Icon/Icon.jsx";
import "./Checkbox.css";

function Checkbox({ id, checked, onChange, error, children, ref, ...inputProps }) {
  const errorId = `${id}-error`;

  return (
    <div className={`checkbox-field ${error ? "has-error" : ""}`}>
      <label className="checkbox" htmlFor={id}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="checkbox__input"
          checked={checked}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        <span className="checkbox__box" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
        <span className="checkbox__label">{children}</span>
      </label>

      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Checkbox;
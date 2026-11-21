import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import FormField from "../../components/FormField/FormField.jsx";
import PasswordStrength from "../../components/PasswordStrength/PasswordStrength.jsx";
import CodeInput from "../../components/CodeInput/CodeInput.jsx";
import AuthIcon from "../../components/AuthIcon/AuthIcon.jsx";
import BackLink from "../../components/BackLink/BackLink.jsx";
import { useCountdown } from "../../hooks/useCountdown.js";
import {
  validateAccount,
  validateCode,
  validateConfirmPassword,
  validatePassword,
} from "../../utils/validation.js";
import "./ForgotPassword.css";

// عدد أرقام رمز التحقق
const CODE_LENGTH = 6;

// مدة الانتظار قبل السماح بإعادة إرسال الرمز (بالثواني)
const RESEND_DELAY = 60;

// مدة محاكاة طلب الخادم
const FAKE_REQUEST_TIME = 1000;

// مؤقتًا: الرمز الصحيح للتجربة، لاحقًا يتحقق منه الباك إند
const DEMO_CODE = "123456";

// الخطوات بالترتيب (done ليست من الخطوات المرقّمة)
const STEPS = ["request", "code", "password"];

const EMPTY_CODE = Array(CODE_LENGTH).fill("");

function ForgotPassword() {
  const { t } = useTranslation();

  const [step, setStep] = useState("request"); // request | code | password | done
  const [isLoading, setIsLoading] = useState(false);

  // الخطوة 1: الحساب
  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState("");

  // الخطوة 2: رمز التحقق
  const [code, setCode] = useState(EMPTY_CODE);
  const [codeError, setCodeError] = useState("");
  const [isResent, setIsResent] = useState(false);

  // الخطوة 3: كلمة المرور الجديدة
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState({});

  const countdown = useCountdown();

  const accountRef = useRef(null);
  const codeRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  // مؤقتًا: محاكاة طلب الخادم إلى أن يجهز الباك إند
  function fakeRequest(onDone) {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onDone();
    }, FAKE_REQUEST_TIME);
  }

  /* ===== الخطوة 1: إرسال الرمز ===== */
  function handleAccountChange(event) {
    setAccount(event.target.value);
    setAccountError("");
  }

  function handleRequestSubmit(event) {
    event.preventDefault();

    const error = validateAccount(account);
    setAccountError(error);

    if (error) {
      accountRef.current.focus();
      return;
    }

    fakeRequest(() => {
      countdown.start(RESEND_DELAY);
      setCode(EMPTY_CODE);
      setCodeError("");
      setIsResent(false);
      setStep("code");
    });
  }

  /* ===== الخطوة 2: التحقق من الرمز ===== */
  function handleCodeChange(nextCode) {
    setCode(nextCode);
    setCodeError("");
  }

  function verifyCode(enteredCode) {
    const error = validateCode(enteredCode, CODE_LENGTH);
    setCodeError(error);

    if (error) {
      codeRef.current.focus();
      return;
    }

    fakeRequest(() => {
      if (enteredCode !== DEMO_CODE) {
        setCodeError("errors.codeWrong");
        setCode(EMPTY_CODE);
        setTimeout(() => codeRef.current?.focus());
        return;
      }

      setStep("password");
    });
  }

  function handleCodeSubmit(event) {
    event.preventDefault();
    verifyCode(code.join(""));
  }

  function handleResend() {
    fakeRequest(() => {
      countdown.start(RESEND_DELAY);
      setCode(EMPTY_CODE);
      setCodeError("");
      setIsResent(true);
      codeRef.current?.focus();
    });
  }

  function handleChangeAccount() {
    setStep("request");
  }

  /* ===== الخطوة 3: كلمة المرور الجديدة ===== */
  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswords((current) => ({ ...current, [name]: value }));
    setPasswordErrors((current) => ({ ...current, [name]: "" }));
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      password: validatePassword(passwords.password),
      confirmPassword: validateConfirmPassword(passwords.confirmPassword, passwords.password),
    };

    setPasswordErrors(nextErrors);

    if (nextErrors.password) {
      passwordRef.current.focus();
      return;
    }

    if (nextErrors.confirmPassword) {
      confirmRef.current.focus();
      return;
    }

    // لاحقًا نرسل الحساب والرمز وكلمة المرور الجديدة إلى الباك إند
    fakeRequest(() => setStep("done"));
  }

  /* ===== الخطوة الأخيرة: تم التغيير ===== */
  if (step === "done") {
    return (
      <section className="auth-card">
        <div className="forgot__step">
          <div className="auth-card__head">
            <AuthIcon name="check" variant="success" animation="draw" />
            <h1 className="auth-card__title">{t("forgot.doneTitle")}</h1>
            <p className="auth-card__subtitle">{t("forgot.doneText")}</p>
          </div>

          <Link to="/login" className="btn btn--primary auth-form__submit">
            {t("forgot.goToLogin")}
          </Link>
        </div>
      </section>
    );
  }

  const stepNumber = STEPS.indexOf(step) + 1;

  return (
    <section className="auth-card">
      {/* شريط تقدّم الخطوات */}
      <div className="forgot__progress">
        <div className="forgot__bars" aria-hidden="true">
          {STEPS.map((name, index) => (
            <span key={name} className={`forgot__bar ${index < stepNumber ? "is-active" : ""}`} />
          ))}
        </div>
        <p className="forgot__step-label">
          {t("forgot.stepOf", { current: stepNumber, total: STEPS.length })}
        </p>
      </div>

      {step === "request" && (
        <div key="request" className="forgot__step">
          <div className="auth-card__head">
            <AuthIcon name="lock" />
            <h1 className="auth-card__title">{t("forgot.title")}</h1>
            <p className="auth-card__subtitle">{t("forgot.subtitle")}</p>
          </div>

          <form className="auth-form" onSubmit={handleRequestSubmit} noValidate>
            <FormField
              ref={accountRef}
              id="forgot-account"
              name="account"
              label={t("login.account")}
              autoComplete="username"
              value={account}
              error={accountError && t(accountError)}
              onChange={handleAccountChange}
            />

            <button type="submit" className="btn btn--primary auth-form__submit" disabled={isLoading}>
              {isLoading ? t("forgot.sending") : t("forgot.sendCode")}
            </button>
          </form>
        </div>
      )}

      {step === "code" && (
        <div key="code" className="forgot__step">
          <div className="auth-card__head">
            <AuthIcon name="mail" animation="float" />
            <h1 className="auth-card__title">{t("forgot.codeTitle")}</h1>
            <p className="auth-card__subtitle">{t("forgot.codeText", { length: CODE_LENGTH })}</p>
            <p className="forgot__account" dir="ltr">
              {account.trim()}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleCodeSubmit} noValidate>
            <div className="forgot__code">
              <CodeInput
                ref={codeRef}
                value={code}
                error={codeError}
                disabled={isLoading}
                onChange={handleCodeChange}
                onComplete={verifyCode}
              />

              {codeError && (
                <p className="code-input__error" role="alert">
                  {t(codeError)}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn--primary auth-form__submit" disabled={isLoading}>
              {isLoading ? t("forgot.verifying") : t("forgot.verify")}
            </button>
          </form>

          <div className="forgot__actions">
            <button
              type="button"
              className="btn btn--ghost forgot__resend"
              disabled={countdown.isRunning || isLoading}
              onClick={handleResend}
            >
              {countdown.isRunning
                ? t("forgot.resendIn", { seconds: countdown.secondsLeft })
                : t("forgot.resend")}
            </button>

            <button type="button" className="forgot__change" onClick={handleChangeAccount}>
              {t("forgot.changeAccount")}
            </button>
          </div>

          {isResent && (
            <p className="auth-form__status" role="status">
              {t("forgot.resent")}
            </p>
          )}
        </div>
      )}

      {step === "password" && (
        <div key="password" className="forgot__step">
          <div className="auth-card__head">
            <AuthIcon name="key" />
            <h1 className="auth-card__title">{t("forgot.passwordTitle")}</h1>
            <p className="auth-card__subtitle">{t("forgot.passwordText")}</p>
          </div>

          <form className="auth-form" onSubmit={handlePasswordSubmit} noValidate>
            <div className="forgot__password">
              <FormField
                ref={passwordRef}
                id="forgot-password"
                name="password"
                type="password"
                label={t("forgot.newPassword")}
                autoComplete="new-password"
                value={passwords.password}
                error={passwordErrors.password && t(passwordErrors.password)}
                onChange={handlePasswordChange}
              />
              <PasswordStrength password={passwords.password} />
            </div>

            <FormField
              ref={confirmRef}
              id="forgot-confirm"
              name="confirmPassword"
              type="password"
              label={t("register.confirmPassword")}
              autoComplete="new-password"
              value={passwords.confirmPassword}
              error={passwordErrors.confirmPassword && t(passwordErrors.confirmPassword)}
              onChange={handlePasswordChange}
            />

            <button type="submit" className="btn btn--primary auth-form__submit" disabled={isLoading}>
              {isLoading ? t("forgot.saving") : t("forgot.save")}
            </button>
          </form>
        </div>
      )}

      <div className="auth-card__divider" />

      <BackLink to="/login">{t("forgot.backToLogin")}</BackLink>
    </section>
  );
}

export default ForgotPassword;
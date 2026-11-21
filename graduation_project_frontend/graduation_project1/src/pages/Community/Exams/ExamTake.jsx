import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import Icon from "../../../components/Icon/Icon.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { PostOrigin } from "../CommunityPostCard/CommunityPostCard.jsx";
import { ExamAuthor } from "./Exams.jsx";
import ExamStats from "./ExamStats.jsx";
import ExamQuestion from "./ExamQuestion.jsx";
import ReportButton from "../ReportButton/ReportButton.jsx";
import { findCommunity } from "../../../data/communities.js";
import { useNow } from "../../../hooks/useNow.js";
import { editExamPath, percentOf } from "./examUtils.js";
import "../../Study/Search/Search.css";
import "./Exams.css";

// الوقت المتبقي بصيغة 04:59
function formatClock(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

// رسالة النتيجة حسب النسبة
function resultLevel(percent) {
  if (percent >= 85) return "excellent";
  if (percent >= 50) return "good";
  return "retry";
}

/**
 * امتحان واحد: المقدمة ← الأسئلة مع عدّاد الوقت (ينسلّم لحاله لما يخلص الوقت) ← النتيجة مع التصحيح.
 * صاحب الامتحان بيشوف إحصائياته وزر التعديل، وغيره بيقدر يبلّغ عنه.
 */
function ExamRunner({ examId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { exams, me } = useOutletContext();

  const exam = exams.findExam(examId);
  const result = exams.results[examId];

  // startedAt: وقت البدء (null = لسا ما بلش)  •  answers: رقم الخيار لكل سؤال
  const [startedAt, setStartedAt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const isRunning = startedAt !== null && !result;
  const now = useNow(isRunning);

  const deadline = exam && startedAt ? startedAt + exam.duration * 60 * 1000 : null;
  // useNow متوقف قبل البدء، فنأخذ وقت البدء إن كان أحدث منه
  const timeLeft = deadline ? deadline - Math.max(now, startedAt) : 0;

  // خلص الوقت: ينسلّم الامتحان بالأجوبة الموجودة
  useEffect(() => {
    if (isRunning && timeLeft <= 0) exams.submitResult(exam, answers);
  }, [isRunning, timeLeft, exams, exam, answers]);

  if (!exam) {
    return (
      <>
        <StudyHeader title={t("community.exams.notFound")} backTo="/community/exams" />
        <EmptyState icon="search" title={t("community.exams.notFound")} text={t("community.exams.notFoundText")}>
          <Link to="/community/exams" className="search-clear">
            {t("community.nav.exams")}
          </Link>
        </EmptyState>
      </>
    );
  }

  const community = findCommunity(exam.communityId);
  const author = exam.isMine ? me : exam.author;
  const answeredCount = answers.filter((answer) => answer !== null && answer !== undefined).length;
  const unansweredCount = exam.questions.length - answeredCount;

  function start() {
    setAnswers(exam.questions.map(() => null));
    setIsConfirming(false);
    setStartedAt(Date.now());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function choose(index, optionIndex) {
    setAnswers((current) => current.map((answer, i) => (i === index ? optionIndex : answer)));
    setIsConfirming(false);
  }

  // التسليم: إذا في أسئلة بدون جواب نطلب تأكيد أول
  function submit() {
    if (unansweredCount > 0 && !isConfirming) {
      setIsConfirming(true);
      return;
    }

    exams.submitResult(exam, answers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retake() {
    exams.resetResult(exam.id);
    start();
  }

  function remove() {
    exams.deleteExam(exam.id);
    navigate("/community/exams", { replace: true });
  }

  // رأس الامتحان: المكان، العنوان، الكاتب، والمعلومات
  const intro = (
    <section className="exam-intro" style={{ "--track": community?.color }}>
      <PostOrigin post={{ communityId: exam.communityId, branchId: exam.branchId }} />
      <h2 className="exam-intro__title" dir="auto">
        {exam.title}
      </h2>
      {exam.description && (
        <p className="exam-intro__description" dir="auto">
          {exam.description}
        </p>
      )}
      <div className="exam-intro__meta">
        <ExamAuthor author={author} isMine={exam.isMine} />
        <span>
          <Icon name="checkSquare" size={14} />
          {t("community.exams.questionsCount", { count: exam.questions.length })}
        </span>
        <span>
          <Icon name="clock" size={14} />
          {t("community.exams.minutes", { count: exam.duration })}
        </span>
      </div>
    </section>
  );

  // ----- النتيجة -----
  if (result) {
    const percent = percentOf(result);
    const level = resultLevel(percent);

    return (
      <>
        <StudyHeader title={exam.title} backTo="/community/exams" />
        {intro}

        <section className={`exam-result is-${level}`}>
          <div className="exam-result__ring" style={{ "--percent": percent }}>
            <strong>{percent}%</strong>
          </div>
          <div className="exam-result__text">
            <h2>{t(`community.exams.result.${level}`)}</h2>
            <p>{t("community.exams.score", { score: result.score, total: result.total })}</p>
            <div className="exam-result__actions">
              <button type="button" className="exam-button" onClick={retake}>
                <Icon name="reset" size={16} />
                {t("community.exams.retake")}
              </button>
              <Link to="/community/exams" className="exam-button exam-button--ghost">
                {t("community.nav.exams")}
              </Link>
            </div>
          </div>
        </section>

        {/* إحصائيات صاحب الامتحان */}
        {exam.isMine && <ExamStats exam={exam} myResult={result} />}

        <h2 className="exam-section-title">{t("community.exams.review")}</h2>
        <div className="exam-questions">
          {exam.questions.map((question, index) => (
            <ExamQuestion
              key={question.id}
              question={question}
              index={index}
              chosen={result.answers[index] ?? null}
              isReview
            />
          ))}
        </div>
      </>
    );
  }

  // ----- المقدمة -----
  if (!isRunning) {
    return (
      <>
        <StudyHeader title={exam.title} backTo="/community/exams" />
        {intro}

        <section className="exam-start">
          <ul className="exam-start__rules">
            <li>
              <Icon name="checkSquare" size={16} />
              {t("community.exams.rules.choose")}
            </li>
            <li>
              <Icon name="clock" size={16} />
              {t("community.exams.rules.time", { count: exam.duration })}
            </li>
            <li>
              <Icon name="eye" size={16} />
              {t("community.exams.rules.review")}
            </li>
          </ul>

          <div className="exam-start__actions">
            <button type="button" className="exam-button" onClick={start}>
              <Icon name="play" size={16} />
              {t("community.exams.start")}
            </button>
            {/* امتحاني: تعديل أو حذف  •  امتحان غيري: إبلاغ */}
            {exam.isMine ? (
              <>
                <Link to={editExamPath(exam.id)} className="exam-button exam-button--ghost">
                  <Icon name="feather" size={16} />
                  {t("community.exams.edit")}
                </Link>
                <button type="button" className="exam-button exam-button--danger" onClick={remove}>
                  <Icon name="trash" size={16} />
                  {t("community.exams.delete")}
                </button>
              </>
            ) : (
              <ReportButton targetType="exam" targetId={exam.id} title={exam.title} />
            )}
          </div>
        </section>

        {/* إحصائيات صاحب الامتحان */}
        {exam.isMine && <ExamStats exam={exam} />}
      </>
    );
  }

  // ----- أثناء الامتحان -----
  const isLow = timeLeft <= 60 * 1000;

  return (
    <>
      <StudyHeader title={exam.title} backTo="/community/exams">
        {/* الوقت المتبقي وكم سؤال جاوبت */}
        <div className="exam-bar">
          <span className={`exam-bar__timer ${isLow ? "is-low" : ""}`} role="timer" aria-label={t("community.exams.timeLeft")}>
            <Icon name="clock" size={16} />
            {formatClock(timeLeft)}
          </span>
          <span className="exam-bar__progress">
            {t("community.exams.answered", { count: answeredCount, total: exam.questions.length })}
          </span>
          <span className="exam-bar__track" aria-hidden="true">
            <span style={{ width: `${(answeredCount / exam.questions.length) * 100}%` }} />
          </span>
        </div>
      </StudyHeader>

      <div className="exam-questions">
        {exam.questions.map((question, index) => (
          <ExamQuestion
            key={question.id}
            question={question}
            index={index}
            chosen={answers[index] ?? null}
            onChoose={(optionIndex) => choose(index, optionIndex)}
          />
        ))}
      </div>

      <div className="exam-submit">
        {isConfirming && (
          <p className="exam-submit__warning" role="alert">
            {t("community.exams.confirm", { count: unansweredCount })}
          </p>
        )}
        <button type="button" className="exam-button" onClick={submit}>
          <Icon name="send" size={16} />
          {t(isConfirming ? "community.exams.submitAnyway" : "community.exams.submit")}
        </button>
      </div>
    </>
  );
}

/**
 * صفحة الامتحان: /community/exams/:examId
 * key: امتحان جديد = حالة جديدة (لو انتقلت من امتحان لامتحان ثاني)
 */
function ExamTake() {
  const { examId } = useParams();
  return <ExamRunner key={examId} examId={examId} />;
}

export default ExamTake;
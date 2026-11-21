import { useTranslation } from "react-i18next";
import Icon from "../../../components/Icon/Icon.jsx";
import { SCORE_BANDS, getExamStats } from "../../../utils/examStats.js";
import { optionLetter } from "./examUtils.js";
import "./ExamStats.css";

/**
 * إحصائيات الامتحان (لصاحبه بس): كم حدا قدّمه، معدّل العلامات، نسبة النجاح،
 * توزيع العلامات، ونسبة الإجابة الصحيحة بكل سؤال مع أصعب سؤال وأكثر جواب غلط اختاروه.
 * exam: الامتحان  •  myResult: نتيجتي إن قدّمته
 */
function ExamStats({ exam, myResult }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const stats = getExamStats(exam, myResult);
  const biggestBand = Math.max(...Object.values(stats.bands), 1);

  return (
    <section className="exam-stats" aria-labelledby="exam-stats-title">
      <h2 id="exam-stats-title" className="exam-stats__title">
        <Icon name="chart" size={18} />
        {t("community.exams.stats.title")}
      </h2>

      {/* الأرقام الرئيسية */}
      <div className="exam-stats__numbers">
        <div className="exam-stats__number">
          <strong>{stats.takers}</strong>
          <span>{t("community.exams.stats.takers")}</span>
        </div>
        <div className="exam-stats__number">
          <strong>{stats.average}%</strong>
          <span>{t("community.exams.stats.average")}</span>
        </div>
        <div className="exam-stats__number">
          <strong>{stats.passRate}%</strong>
          <span>{t("community.exams.stats.passRate")}</span>
        </div>
      </div>

      {/* توزيع العلامات */}
      <h3 className="exam-stats__subtitle">{t("community.exams.stats.distribution")}</h3>
      <ul className="exam-stats__bands">
        {SCORE_BANDS.map((band) => (
          <li key={band.id} className={`exam-stats__band is-${band.id}`}>
            <span className="exam-stats__band-label" dir="ltr">
              {band.min}–{band.max}%
            </span>
            <span className="exam-stats__band-track" aria-hidden="true">
              <span style={{ width: `${(stats.bands[band.id] / biggestBand) * 100}%` }} />
            </span>
            <span className="exam-stats__band-count">
              {t("community.exams.stats.students", { count: stats.bands[band.id] })}
            </span>
          </li>
        ))}
      </ul>

      {/* كل سؤال: نسبة اللي جاوبوه صح */}
      <h3 className="exam-stats__subtitle">{t("community.exams.stats.perQuestion")}</h3>
      <ol className="exam-stats__questions">
        {exam.questions.map((question, index) => {
          const item = stats.questions[index];
          const isHardest = index === stats.hardestIndex;

          return (
            <li key={question.id} className={`exam-stats__question ${isHardest ? "is-hardest" : ""}`}>
              <div className="exam-stats__question-head">
                <span className="exam-stats__question-number">
                  {t("community.exams.questionNumber", { number: index + 1 })}
                </span>
                {isHardest && (
                  <span className="exam-stats__hardest">
                    <Icon name="flame" size={13} />
                    {t("community.exams.stats.hardest")}
                  </span>
                )}
              </div>
              <p className="exam-stats__question-text" dir="auto">
                {question.text}
              </p>
              <div className="exam-stats__rate">
                <span className="exam-stats__rate-track" aria-hidden="true">
                  <span style={{ width: `${item.correctRate}%` }} />
                </span>
                <span>{t("community.exams.stats.correctRate", { value: item.correctRate })}</span>
              </div>
              {/* أكثر جواب غلط: بيساعد الدكتور يعرف وين الفهم الغلط */}
              {item.commonWrong !== null && (
                <p className="exam-stats__wrong">
                  {t("community.exams.stats.commonWrong", { letter: optionLetter(item.commonWrong, language) })}{" "}
                  <bdi>{question.options[item.commonWrong]}</bdi>
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default ExamStats;
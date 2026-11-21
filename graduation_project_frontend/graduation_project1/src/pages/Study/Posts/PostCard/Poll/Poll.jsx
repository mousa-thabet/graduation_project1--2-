import { useTranslation } from "react-i18next";
import Icon from "../../../../../components/Icon/Icon.jsx";
import "./Poll.css";

/**
 * استطلاع داخل المنشور.
 * قبل التصويت: أزرار للخيارات. بعده (أو لصاحب المنشور): النسب بأشرطة متحركة.
 */
function Poll({ poll, showResults, onVote }) {
  const { t } = useTranslation();

  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const topVotes = Math.max(...poll.options.map((option) => option.votes));
  const hasResults = showResults || Boolean(poll.myVote);

  return (
    <div className="poll">
      {poll.options.map((option) => {
        if (!hasResults) {
          return (
            <button key={option.id} type="button" className="poll__option" onClick={() => onVote(option.id)}>
              {option.text}
            </button>
          );
        }

        const percent = total ? Math.round((option.votes / total) * 100) : 0;
        const isMine = option.id === poll.myVote;

        return (
          <div
            key={option.id}
            className={`poll__result ${option.votes === topVotes && total > 0 ? "is-top" : ""}`}
          >
            <span className="poll__fill" style={{ width: `${percent}%` }} />
            <span className="poll__text">
              {option.text}
              {isMine && <Icon name="check" size={16} strokeWidth={2.5} />}
            </span>
            <span className="poll__percent">{percent}%</span>
          </div>
        );
      })}

      <span className="poll__meta">
        {t("studyApp.poll.votes", { count: total })}
        {poll.myVote && ` · ${t("studyApp.poll.voted")}`}
      </span>
    </div>
  );
}

export default Poll;
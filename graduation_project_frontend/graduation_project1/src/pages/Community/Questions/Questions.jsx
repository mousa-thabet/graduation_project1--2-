import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import CommunityComposer from "../CommunityComposer/CommunityComposer.jsx";
import PostList, { TypeTabs } from "../PostList/PostList.jsx";

// الأحدث، أو الأسئلة التي لم يرد عليها أحد بعد (حتى تساعد أصحابها)
const TABS = ["latest", "unanswered"];

/**
 * الأسئلة: /community/questions
 * أسئلة مجتمعاتي فقط، مع صندوق كتابة يبدأ على "سؤال".
 */
function Questions() {
  const { t } = useTranslation();
  const { feed, memberships, me } = useOutletContext();
  const [tab, setTab] = useState("latest");

  const questions = feed.posts.filter((post) => post.type === "question" && memberships.isInFeed(post));
  const visible = tab === "unanswered" ? questions.filter((post) => post.comments.length === 0) : questions;

  return (
    <>
      <StudyHeader title={t("community.nav.questions")}>
        <TypeTabs value={tab} onChange={setTab} tabs={TABS} />
      </StudyHeader>

      <CommunityComposer feed={feed} me={me} myCommunities={memberships.myCommunities} defaultType="question" />

      <PostList
        posts={visible}
        actions={feed}
        empty={{
          icon: "comment",
          title: t(tab === "unanswered" ? "community.questions.allAnswered" : "community.questions.emptyTitle"),
          text: t(tab === "unanswered" ? "community.questions.allAnsweredText" : "community.questions.emptyText"),
        }}
      />
    </>
  );
}

export default Questions;
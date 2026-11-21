import { useTranslation } from "react-i18next";
import { Link, useOutletContext, useParams } from "react-router";
import Avatar from "../../../components/Avatar/Avatar.jsx";
import { UserBadges } from "../../../components/UserBadge/UserBadge.jsx";
import StudyHeader from "../../Study/StudyHeader/StudyHeader.jsx";
import EmptyState from "../../Study/EmptyState/EmptyState.jsx";
import { CURRENT_USER } from "../../../data/currentUser.js";
import { COMMUNITY_PEOPLE, communityProfilePath, findCommunityPerson } from "../../../data/communityPeople.js";
import { getFollowersList, getFollowingList } from "../../../utils/people.js";
import "../../Profile/Profile.css";
import "./CommunityProfile.css";

const LISTS = ["followers", "following"];

/**
 * المتابعون ومن يتابعهم في التواصل: /community/profile/اسم_المستخدم/followers أو /following
 * المتابعة هنا منفصلة عن ادرس معي.
 */
function CommunityConnections() {
  const { t } = useTranslation();
  const { handle, list } = useParams();
  const { profile, following, isFollowing, toggleFollow, me } = useOutletContext();

  const isMe = handle === CURRENT_USER.handle;
  const person = isMe ? { ...me, name: profile.profile.name, follows: following } : findCommunityPerson(handle);

  if (!person || !LISTS.includes(list)) {
    return (
      <>
        <StudyHeader title={t("studyApp.nav.profile")} backTo="/community" />
        <EmptyState icon="userX" title={t("studyApp.profile.notFound")} text={t("studyApp.profile.notFoundText")} />
      </>
    );
  }

  const listArgs = { isMe, person, me, myFollowing: following, people: COMMUNITY_PEOPLE };
  const people = list === "followers" ? getFollowersList(listArgs) : getFollowingList(listArgs);

  return (
    <>
      <StudyHeader title={person.name} backTo={communityProfilePath(person.handle)}>
        {/* التبويبان روابط حتى يكون لكل قائمة رابطها الخاص */}
        <div className="study-tabs" role="tablist">
          {LISTS.map((item) => (
            <Link
              key={item}
              to={`${communityProfilePath(person.handle)}/${item}`}
              role="tab"
              aria-selected={list === item}
              className="study-tabs__tab profile-connections__tab"
            >
              {t(`studyApp.profile.connections.${item}`)}
            </Link>
          ))}
        </div>
      </StudyHeader>

      {people.length === 0 ? (
        <EmptyState
          icon="users"
          title={t(`studyApp.profile.connections.empty.${list}`)}
          text={t("studyApp.profile.connections.emptyText")}
        />
      ) : (
        <ul className="profile-people">
          {people.map((item) => {
            const isMeItem = item.id === CURRENT_USER.id;
            const followed = isFollowing(item.id);

            return (
              <li key={item.id} className="profile-person">
                <Link to={communityProfilePath(item.handle)} className="profile-person__link">
                  <span className="profile-person__avatar" aria-hidden="true">
                    <Avatar person={item} />
                  </span>
                  <span className="profile-person__text">
                    <span className="profile-person__name">
                      <bdi>{item.name}</bdi>
                      <UserBadges badges={item.badges} size={15} />
                    </span>
                    <span className="profile-person__handle-row">
                      <span dir="ltr">@{item.handle}</span>
                      {item.followsMe && <span className="profile__badge">{t("studyApp.profile.followsYou")}</span>}
                    </span>
                    {/* التخصص بدل النبذة في قوائم التواصل */}
                    {item.headline && <span className="profile-person__bio">{item.headline}</span>}
                  </span>
                </Link>

                {isMeItem ? (
                  <span className="profile__badge">{t("studyApp.profile.you")}</span>
                ) : (
                  <button
                    type="button"
                    className={`profile__follow profile__follow--small ${followed ? "is-following" : ""}`}
                    aria-pressed={followed}
                    onClick={() => toggleFollow(item.id)}
                  >
                    <span className="profile__follow-text">
                      {followed ? t("studyApp.profile.following") : t("studyApp.profile.follow")}
                    </span>
                    {followed && <span className="profile__follow-hover">{t("studyApp.profile.unfollow")}</span>}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default CommunityConnections;
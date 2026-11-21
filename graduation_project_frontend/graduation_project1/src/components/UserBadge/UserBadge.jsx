import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { findCommunity, localName } from "../../data/communities.js";
import { experiencePath } from "../../data/badges.js";
import "./UserBadge.css";

/**
 * شارة شخص بجانب اسمه:
 * 🛡️ أزرق (expert) = خبرة بمسار معيّن  •  🛡️ أخضر (scholar) = قيمة علمية
 * الشارة تعني أن الإدارة تحققت من خبرة الشخص فقط، وليس أن كل إجاباته صحيحة.
 * badge: { type, communityId }
 * handle (اختياري): الدرع بيصير رابط لصفحة خبرات الشخص
 * (ما بنمرّره إذا الدرع أصلًا جوّا رابط، لأنه ما بصير رابط جوّا رابط)
 */
function UserBadge({ badge, size = 16, handle }) {
  const { t, i18n } = useTranslation();
  const community = findCommunity(badge.communityId);

  const label =
    badge.type === "scholar"
      ? t("community.badges.scholar.title")
      : t("community.badges.expert.in", { field: community ? localName(community, i18n.resolvedLanguage) : "" });
  const hint = `${label} — ${t("community.badges.tooltip")}`;

  const shield = (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path className="user-badge__shield" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path className="user-badge__check" d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );

  // رابط: بيفتح صفحة الخبرات عند هاي الشارة
  if (handle) {
    return (
      <Link
        to={experiencePath(handle, badge)}
        className={`user-badge user-badge--${badge.type} user-badge--link`}
        aria-label={`${label}: ${t("community.experience.open")}`}
        title={`${hint} · ${t("community.experience.open")}`}
      >
        {shield}
      </Link>
    );
  }

  return (
    <span className={`user-badge user-badge--${badge.type}`} role="img" aria-label={label} title={hint}>
      {shield}
    </span>
  );
}

/**
 * شارة واحدة بس جنب الاسم (بالمنشورات والتعليقات والحساب وكل مكان):
 * عنده درع أخضر ← الأخضر بس (الأزرق ما بيبين)  •  ما عنده أخضر ← أول درع أزرق.
 * كل الشارات بتبين بصفحة الخبرات وبتبويب "الشارات" بالحساب.
 * badges: قائمة الشارات (قد تكون فارغة)  •  handle: لجعل الدرع رابط لصفحة الخبرات
 */
export function UserBadges({ badges = [], size, handle }) {
  if (badges.length === 0) return null;

  const badge = badges.find((item) => item.type === "scholar") ?? badges[0];

  return (
    <span className="user-badges">
      <UserBadge badge={badge} size={size} handle={handle} />
    </span>
  );
}

export default UserBadge;
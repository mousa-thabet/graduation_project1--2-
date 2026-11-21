// حسابات الأشخاص في قسم التواصل (تجريبية إلى أن يجهز الباك إند)
// الاسم والصورة والمتابعة من الحساب نفسه (studyPeople)، أما الباقي فخاص بالتواصل:
// headline: التخصص أو المسمى  •  bio: النبذة  •  communities: المسارات التي انضم لها  •  pinnedPostId: منشوره المثبّت
// المتابعة (follows / followsMe) واحدة بالقسمين: اللي بتابعه هون بتابعه بادرس معي، والعكس

import { PEOPLE } from "./studyPeople.js";
import { withBadges } from "./badges.js";

const daysAgo = (days) => Date.now() - days * 24 * 60 * 60 * 1000;

const COMMUNITY_PROFILES = {
  p1: {
    headline: "باحثة ذكاء اصطناعي · مدرّبة NLP",
    bio: "بشارك ملخصات عن النماذج اللغوية وتعلّم الآلة بلغة بسيطة #LLMs",
    university: "جامعة النجاح الوطنية",
    website: "",
    joinedAt: daysAgo(180),
    communities: ["ai", "general"],
    pinnedPostId: "cp-2",
  },
  p2: {
    headline: "Front-End Developer · React",
    bio: "Building UIs with React & CSS. Ask me anything about Front-End #React",
    university: "Birzeit University",
    website: "https://github.com",
    joinedAt: daysAgo(320),
    communities: ["frontend", "backend", "general"],
    pinnedPostId: "cp-8",
  },
  p3: {
    headline: "مصممة قواعد بيانات · UI/UX",
    bio: "ER و Normalization وتصميم واجهات بسيطة ✨",
    university: "الجامعة العربية الأمريكية",
    website: "",
    joinedAt: daysAgo(80),
    communities: ["databases", "uiux", "ai"],
    pinnedPostId: null,
  },
  p4: {
    headline: "",
    bio: "",
    university: "",
    website: "",
    joinedAt: daysAgo(2),
    communities: ["frontend", "algorithms"],
    pinnedPostId: null,
  },
};

// كل الأشخاص بحساباتهم في التواصل (مع شاراتهم)
export const COMMUNITY_PEOPLE = PEOPLE.map(({ id, name, handle, follows, followsMe }) =>
  withBadges({ id, name, handle, follows, followsMe, ...COMMUNITY_PROFILES[id] })
);

export function findCommunityPerson(handle) {
  return COMMUNITY_PEOPLE.find((person) => person.handle === handle) ?? null;
}

// رابط حساب شخص في التواصل
export function communityProfilePath(handle) {
  return `/community/profile/${handle}`;
}
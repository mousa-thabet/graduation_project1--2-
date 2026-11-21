// شارات الأشخاص (تجريبية إلى أن يجهز الباك إند)
// expert: درع أزرق = خبرة بمسار معيّن (communityId)
// scholar: درع أخضر = قيمة علمية (دكتور، باحث، مدرّب)، ويسمح بنشر الدورات والامتحانات والبث التعليمي
// الشارة تعني أن الإدارة تحققت من خبرة الشخص، وليس أن كل كلامه صحيح

export const BADGE_TYPES = ["expert", "scholar"];

export const PEOPLE_BADGES = {
  p1: [{ type: "scholar" }, { type: "expert", communityId: "ai" }],
  p2: [{ type: "expert", communityId: "frontend" }],
  p3: [{ type: "expert", communityId: "databases" }],
};

const daysAgo = (days) => Date.now() - days * 24 * 60 * 60 * 1000;

// مفتاح الشارة: "scholar" أو "expert:ai" (نفس الشارة = نفس المفتاح)
export const badgeKey = (badge) => (badge.type === "scholar" ? "scholar" : `expert:${badge.communityId}`);

/**
 * خبرات الأشخاص اللي تحققت منها الإدارة (صفحة الخبرات لما تضغط على الدرع).
 * credential: الشهادة أو المسمى  •  details: تعريفه بخبرته  •  proof: نوع الإثبات  •  verifiedAt: وقت الموافقة
 * النصوص كتبها أصحابها، فما بتنترجم (زي النبذة).
 */
export const PEOPLE_EXPERIENCE = {
  p1: {
    scholar: {
      credential: "دكتوراه في الذكاء الاصطناعي · جامعة النجاح الوطنية",
      details: "باحثة بمعالجة اللغات الطبيعية (NLP)، وبدرّس مساق تعلّم الآلة من 6 سنين، وإلي أبحاث منشورة عن النماذج اللغوية العربية.",
      proof: "certificate",
      verifiedAt: daysAgo(150),
    },
    "expert:ai": {
      credential: "مدرّبة NLP معتمدة · 6 سنين خبرة",
      details: "درّبت أكثر من 20 دفعة على تحليل النصوص وبناء نماذج تصنيف، وعندي مشاريع مفتوحة المصدر على GitHub.",
      proof: "portfolio",
      verifiedAt: daysAgo(150),
    },
  },
  p2: {
    "expert:frontend": {
      credential: "Front-End Developer · 3 years at a software company",
      details: "I build production React apps (design systems, performance, accessibility). Verified with a letter from my current employer.",
      proof: "companyLetter",
      verifiedAt: daysAgo(290),
    },
  },
  p3: {
    "expert:databases": {
      credential: "مصممة قواعد بيانات · شهادة Oracle Database SQL",
      details: "بصمم قواعد بيانات لأنظمة الجامعات والمستشفيات من 4 سنين: ER، Normalization، وتحسين الاستعلامات.",
      proof: "certificate",
      verifiedAt: daysAgo(60),
    },
  },
};

// الشخص مع شاراته
export function withBadges(person, extraBadges = []) {
  return { ...person, badges: [...(PEOPLE_BADGES[person.id] ?? []), ...extraBadges] };
}

// رابط صفحة خبرات شخص (لما تضغط على الدرع جنب اسمه)
// badge (اختياري): بتنزل الصفحة لهاي الشارة بالزبط
export function experiencePath(handle, badge) {
  const path = `/community/profile/${handle}/experience`;
  return badge ? `${path}#${badgeKey(badge).replace(":", "-")}` : path;
}

// نوع ملف الإثبات من اسمه: PDF أو صورة
export function proofTypeOf(fileName = "") {
  return fileName.toLowerCase().endsWith(".pdf") ? "document" : "image";
}
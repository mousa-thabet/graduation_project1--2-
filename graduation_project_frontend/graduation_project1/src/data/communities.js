// مجتمعات قسم التواصل: مجتمع عام يجمع الكل، و6 مسارات تخصصية
// كل مسار فيه فروع (مجتمعات أصغر)، ولكل فرع وسوم أدوات (مثل React)
// الفروع ممكن تصير بالعشرات (مثلًا لغة لكل فرع بالباك إند والفرونت إند)، فالواجهة بتعرض فروعك وبحث بالباقي
// color: لون المسار (يظهر في الغلاف والنقطة جنب اسم المجتمع)
// members: عدد الأعضاء (تجريبي إلى أن يجهز الباك إند)

export const COMMUNITIES = [
  {
    id: "general",
    color: "#94A3B8",
    members: 5210,
    name: { ar: "عام", en: "General" },
    description: {
      ar: "كل المجالات في مكان واحد، وكل ما ليس له مسار معيّن.",
      en: "Every field in one place, plus everything that has no specific track.",
    },
    branches: [
      { id: "careers", name: { ar: "التدريب والوظائف", en: "Internships & jobs" }, tags: ["Internship", "CV", "Interview"] },
      { id: "graduation", name: { ar: "مشاريع التخرج", en: "Graduation projects" }, tags: ["Ideas", "Documentation"] },
      { id: "news", name: { ar: "أخبار التقنية", en: "Tech news" }, tags: ["News", "Events"] },
      { id: "ask", name: { ar: "أسئلة عامة", en: "General questions" }, tags: ["Advice", "Roadmap"] },
    ],
  },
  {
    id: "algorithms",
    color: "#8B5CF6",
    members: 1840,
    name: { ar: "الخوارزميات", en: "Algorithms" },
    description: {
      ar: "هياكل البيانات وحل المسائل والتحضير للمقابلات التقنية.",
      en: "Data structures, problem solving, and technical interview prep.",
    },
    branches: [
      { id: "structures", name: { ar: "هياكل البيانات", en: "Data structures" }, tags: ["Arrays", "Trees", "Graphs"] },
      { id: "problems", name: { ar: "حل المسائل", en: "Problem solving" }, tags: ["LeetCode", "Codeforces"] },
      { id: "complexity", name: { ar: "تحليل التعقيد", en: "Complexity" }, tags: ["Big-O", "Recursion"] },
      { id: "interviews", name: { ar: "المقابلات التقنية", en: "Tech interviews" }, tags: ["Interview", "System design"] },
    ],
  },
  {
    id: "backend",
    color: "#22C55E",
    members: 2160,
    name: { ar: "باك إند", en: "Backend" },
    description: {
      ar: "السيرفرات والـ APIs والأمان والنشر.",
      en: "Servers, APIs, security, and deployment.",
    },
    branches: [
      { id: "frameworks", name: { ar: "الأطر واللغات", en: "Frameworks & languages" }, tags: ["Node.js", "Django", "Laravel", "Spring"] },
      { id: "apis", name: { ar: "بناء الـ APIs", en: "Building APIs" }, tags: ["REST", "GraphQL"] },
      { id: "security", name: { ar: "الأمان والمصادقة", en: "Security & auth" }, tags: ["JWT", "OAuth"] },
      { id: "deploy", name: { ar: "النشر والسيرفرات", en: "Deployment & servers" }, tags: ["Docker", "Linux", "CI/CD"] },
      { id: "node", name: { ar: "Node.js", en: "Node.js" }, tags: ["Express", "NestJS"] },
      { id: "python", name: { ar: "Python", en: "Python" }, tags: ["Django", "FastAPI", "Flask"] },
      { id: "php", name: { ar: "PHP", en: "PHP" }, tags: ["Laravel", "Symfony"] },
      { id: "java", name: { ar: "Java", en: "Java" }, tags: ["Spring Boot"] },
      { id: "csharp", name: { ar: "C# و .NET", en: "C# & .NET" }, tags: ["ASP.NET Core", "Entity Framework"] },
      { id: "go", name: { ar: "Go", en: "Go" }, tags: ["Gin", "Fiber"] },
      { id: "ruby", name: { ar: "Ruby", en: "Ruby" }, tags: ["Ruby on Rails"] },
      { id: "rust", name: { ar: "Rust", en: "Rust" }, tags: ["Actix", "Axum"] },
      { id: "kotlin", name: { ar: "Kotlin", en: "Kotlin" }, tags: ["Ktor"] },
      { id: "elixir", name: { ar: "Elixir", en: "Elixir" }, tags: ["Phoenix"] },
      { id: "microservices", name: { ar: "Microservices", en: "Microservices" }, tags: ["Kafka", "RabbitMQ"] },
      { id: "testing", name: { ar: "الاختبارات", en: "Testing" }, tags: ["Unit tests", "Integration tests"] },
    ],
  },
  {
    id: "frontend",
    color: "#F97316",
    members: 2340,
    name: { ar: "فرونت إند", en: "Frontend" },
    description: {
      ar: "واجهات الويب: الأطر، التنسيق، واللغات.",
      en: "Web interfaces: frameworks, styling, and languages.",
    },
    branches: [
      { id: "frameworks", name: { ar: "Frameworks", en: "Frameworks" }, tags: ["React", "Vue", "Angular"] },
      { id: "styling", name: { ar: "Styling", en: "Styling" }, tags: ["CSS", "Tailwind", "Sass"] },
      { id: "languages", name: { ar: "Languages", en: "Languages" }, tags: ["JavaScript", "TypeScript"] },
      { id: "performance", name: { ar: "الأداء وإمكانية الوصول", en: "Performance & accessibility" }, tags: ["Lighthouse", "a11y"] },
      { id: "react", name: { ar: "React", en: "React" }, tags: ["Hooks", "React Router"] },
      { id: "vue", name: { ar: "Vue", en: "Vue" }, tags: ["Pinia", "Composition API"] },
      { id: "angular", name: { ar: "Angular", en: "Angular" }, tags: ["RxJS", "Signals"] },
      { id: "svelte", name: { ar: "Svelte", en: "Svelte" }, tags: ["SvelteKit"] },
      { id: "nextjs", name: { ar: "Next.js", en: "Next.js" }, tags: ["SSR", "App Router"] },
      { id: "nuxt", name: { ar: "Nuxt", en: "Nuxt" }, tags: ["SSR"] },
      { id: "javascript", name: { ar: "JavaScript", en: "JavaScript" }, tags: ["ES2024", "DOM"] },
      { id: "typescript", name: { ar: "TypeScript", en: "TypeScript" }, tags: ["Types", "Generics"] },
      { id: "tailwind", name: { ar: "Tailwind CSS", en: "Tailwind CSS" }, tags: ["Utility classes"] },
      { id: "sass", name: { ar: "Sass", en: "Sass" }, tags: ["SCSS", "BEM"] },
      { id: "animations", name: { ar: "الحركات", en: "Animations" }, tags: ["GSAP", "Framer Motion"] },
      { id: "webgl", name: { ar: "Three.js و WebGL", en: "Three.js & WebGL" }, tags: ["3D", "Shaders"] },
      { id: "pwa", name: { ar: "تطبيقات الويب PWA", en: "PWA" }, tags: ["Service workers", "Offline"] },
      { id: "testing", name: { ar: "الاختبارات", en: "Testing" }, tags: ["Vitest", "Playwright"] },
    ],
  },
  {
    id: "uiux",
    color: "#EC4899",
    members: 1420,
    name: { ar: "UI/UX", en: "UI/UX" },
    description: {
      ar: "تصميم الواجهات وتجربة المستخدم والهوية البصرية.",
      en: "Interface design, user experience, and visual identity.",
    },
    branches: [
      { id: "ui", name: { ar: "تصميم الواجهات", en: "UI design" }, tags: ["Figma", "Design systems"] },
      { id: "ux", name: { ar: "تجربة المستخدم", en: "User experience" }, tags: ["Research", "Wireframes", "Usability"] },
      { id: "identity", name: { ar: "الهوية والألوان", en: "Identity & color" }, tags: ["Branding", "Typography"] },
    ],
  },
  {
    id: "databases",
    color: "#3B82F6",
    members: 1630,
    name: { ar: "قواعد البيانات", en: "Databases" },
    description: {
      ar: "تصميم قواعد البيانات و SQL و NoSQL والأداء.",
      en: "Database design, SQL, NoSQL, and performance.",
    },
    branches: [
      { id: "sql", name: { ar: "SQL", en: "SQL" }, tags: ["MySQL", "PostgreSQL"] },
      { id: "nosql", name: { ar: "NoSQL", en: "NoSQL" }, tags: ["MongoDB", "Redis"] },
      { id: "design", name: { ar: "التصميم", en: "Design" }, tags: ["ER", "Normalization"] },
      { id: "performance", name: { ar: "الأداء", en: "Performance" }, tags: ["Indexes", "Query optimization"] },
    ],
  },
  {
    id: "ai",
    color: "#14B8A6",
    members: 2980,
    name: { ar: "الذكاء الاصطناعي", en: "AI" },
    description: {
      ar: "تعلّم الآلة والتعلّم العميق والنماذج اللغوية.",
      en: "Machine learning, deep learning, and language models.",
    },
    branches: [
      { id: "ml", name: { ar: "تعلّم الآلة", en: "Machine learning" }, tags: ["scikit-learn", "Python"] },
      { id: "dl", name: { ar: "التعلّم العميق", en: "Deep learning" }, tags: ["PyTorch", "TensorFlow"] },
      { id: "llms", name: { ar: "النماذج اللغوية", en: "Language models" }, tags: ["LLMs", "Hugging Face", "Prompt engineering"] },
      { id: "vision", name: { ar: "الرؤية الحاسوبية", en: "Computer vision" }, tags: ["OpenCV", "YOLO"] },
      { id: "data", name: { ar: "علم البيانات", en: "Data science" }, tags: ["Pandas", "Visualization"] },
    ],
  },
];

// المجتمع العام يجمع كل المسارات
export const GENERAL_ID = "general";

// الاسم باللغة الحالية (الأسماء من البيانات لأنها قد تُضاف لاحقًا من لوحة الأدمن)
export function localName(item, language) {
  return item.name[language] ?? item.name.ar;
}

export function findCommunity(id) {
  return COMMUNITIES.find((community) => community.id === id) ?? null;
}

export function findBranch(communityId, branchId) {
  return findCommunity(communityId)?.branches.find((branch) => branch.id === branchId) ?? null;
}

// رقم الفرع الفريد في كل الموقع: "frontend/frameworks"
export const branchKey = (communityId, branchId) => `${communityId}/${branchId}`;

// رابط مجتمع أو فرع
export function communityPath(communityId, branchId) {
  return branchId ? `/community/c/${communityId}/${branchId}` : `/community/c/${communityId}`;
}

// ----- المجتمعات والفروع الجديدة اللي ضافتها الإدارة -----
// الآن: الأدمن بيضيفها من لوحة التحكم (مباشرة، أو بالموافقة على طلب فرع)،
// وبتنحفظ في المتصفح وتُضاف للقائمة عند فتح الموقع
// لاحقًا: تصل من السيرفر مع باقي المجتمعات
export const CUSTOM_COMMUNITIES_KEY = "areatk-community-custom-communities";
export const CUSTOM_BRANCHES_KEY = "areatk-community-custom-branches";

function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {
    // بيانات تالفة: نتجاهلها
  }

  return [];
}

// إضافة مجتمع للقائمة (إن لم يكن موجودًا من قبل)
function attachCommunity(community) {
  if (!findCommunity(community.id)) COMMUNITIES.push({ ...community, branches: [...community.branches] });
}

// إضافة فرع لمجتمعه (إن لم يكن موجودًا من قبل)
function attachBranch({ communityId, branch }) {
  const community = findCommunity(communityId);
  if (community && !community.branches.some((item) => item.id === branch.id)) community.branches.push(branch);
}

// المجتمعات أولًا، لأنه ممكن يكون في فروع جديدة جوّا مجتمع جديد
loadList(CUSTOM_COMMUNITIES_KEY).forEach(attachCommunity);
loadList(CUSTOM_BRANCHES_KEY).forEach(attachBranch);

// الأدمن ضاف شي من تبويب ثاني: نضيف اللي لسا مش عندنا
export function syncCustomCommunities() {
  loadList(CUSTOM_COMMUNITIES_KEY).forEach(attachCommunity);
}

export function syncCustomBranches() {
  loadList(CUSTOM_BRANCHES_KEY).forEach(attachBranch);
}

/**
 * مجتمع رئيسي جديد ضافه الأدمن: يُضاف للقائمة ويُحفظ.
 * community: { id, color, members, name: { ar, en }, description: { ar, en }, branches, isNew }
 */
export function addCommunity(community) {
  attachCommunity(community);
  localStorage.setItem(CUSTOM_COMMUNITIES_KEY, JSON.stringify([...loadList(CUSTOM_COMMUNITIES_KEY), community]));
}

/**
 * فرع جديد (ضافه الأدمن، أو وافق على طلبه): يُضاف لمجتمعه ويُحفظ.
 * branch: { id, name: { ar, en }, tags, isNew }
 */
export function addBranch(communityId, branch) {
  attachBranch({ communityId, branch });
  localStorage.setItem(CUSTOM_BRANCHES_KEY, JSON.stringify([...loadList(CUSTOM_BRANCHES_KEY), { communityId, branch }]));
}

// رقم من الاسم الإنجليزي: "Cyber Security" ← "cyber-security" (وإذا مكرر أو فاضي بنضيف رقم)
export function makeId(name, takenIds) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "new";
  let id = base;
  let number = 2;
  while (takenIds.includes(id)) id = `${base}-${number++}`;
  return id;
}

// هل يوجد مجتمع بنفس الاسم؟ (بأي لغة)
export function hasCommunityNamed(name) {
  const wanted = name.trim().toLowerCase();
  return COMMUNITIES.some((community) =>
    Object.values(community.name).some((value) => value.trim().toLowerCase() === wanted)
  );
}

// هل يوجد فرع بنفس الاسم في المجتمع؟ (حتى لا يتكرر)
export function hasBranchNamed(communityId, name) {
  const wanted = name.trim().toLowerCase();
  return (findCommunity(communityId)?.branches ?? []).some((branch) =>
    Object.values(branch.name).some((value) => value.trim().toLowerCase() === wanted)
  );
}
// البحث الذكي (مثل يوتيوب وواتساب): النتائج تظهر أثناء الكتابة ومرتبة من الأقرب للأبعد
//
// ترتيب التطابق (من الأقوى للأضعف):
//   1. تطابق تام          "react"      ← "React"
//   2. بداية النص         "rea"        ← "React hooks"
//   3. بداية كلمة         "hoo"        ← "React hooks"
//   4. موجود داخل النص    "eac"        ← "React"
//   5. كل الكلمات موجودة  "hooks react" ← "React hooks"
//   6. بعض الكلمات        "react vue"  ← "React hooks"
//   7. خطأ إملائي بسيط    "raect"      ← "React"

// التشكيل والتطويل في العربية
const TASHKEEL = /[\u064B-\u065F\u0670\u0640]/;

// توحيد الحروف المتشابهة حتى لا يفرق البحث بين "أسئلة" و"اسئله"
const LETTERS = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ة": "ه",
  "ى": "ي",
  "ؤ": "و",
  "ئ": "ي",
};

const SCORES = {
  exact: 100,
  startsWith: 90,
  wordStart: 80,
  contains: 70,
  allWords: 60,
  someWords: 40,
  typo: 30,
};

// حرف واحد بعد التوحيد (أو "" إن كان تشكيلًا)
function normalizeChar(char) {
  if (TASHKEEL.test(char)) return "";
  return LETTERS[char] ?? char.toLowerCase();
}

/**
 * توحيد النص للبحث: حروف صغيرة، بدون تشكيل، الهمزات ألف، التاء المربوطة هاء...
 * "الأسئلةُ" ← "الاسئله"
 */
export function normalize(text = "") {
  return [...String(text)].map(normalizeChar).join("").replace(/\s+/g, " ").trim();
}

// كلمات البحث بدون # و @ في أولها
function toWords(text) {
  return normalize(text)
    .split(" ")
    .map((word) => word.replace(/^[#@]+/, ""))
    .filter(Boolean);
}

// كلمات النص، ومعها نسخة بدون "ال" حتى تطابق "اسئله" كلمة "الاسئله"
function toTextWords(text) {
  return toWords(text).flatMap((word) =>
    word.startsWith("ال") && word.length > 3 ? [word, word.slice(2)] : [word]
  );
}

// عدد التعديلات (حذف، إضافة، تبديل حرف، أو قلب حرفين متجاورين) لتحويل كلمة لأخرى
// raect ← react = 1 (قلب e و a)
function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);

      // حرفان متجاوران مقلوبان
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }

  return rows[a.length][b.length];
}

// أقرب مسافة بين كلمة البحث وكلمات النص (أو null إن كانت بعيدة)
// المسموح: خطأ واحد للكلمات حتى 5 أحرف، وخطآن للأطول
function typoDistance(queryWord, textWords) {
  if (queryWord.length < 3) return null;
  const allowed = queryWord.length <= 5 ? 1 : 2;

  const distances = textWords.map((word) =>
    // نقارن ببداية الكلمة أيضًا: "javascrpt" قريبة من "javascript"
    Math.min(editDistance(queryWord, word), editDistance(queryWord, word.slice(0, queryWord.length)))
  );
  const best = Math.min(...distances);

  return best <= allowed ? best : null;
}

/**
 * درجة تطابق نص واحد مع البحث (0 = لا تطابق، 100 = تطابق تام)
 */
export function scoreText(query, text) {
  const normalQuery = toWords(query).join(" ");
  const normalText = normalize(text);
  if (!normalQuery || !normalText) return 0;

  const textWords = toTextWords(text);
  const queryWords = normalQuery.split(" ");

  if (normalText === normalQuery || toWords(text).join(" ") === normalQuery) return SCORES.exact;
  if (normalText.startsWith(normalQuery)) return SCORES.startsWith;
  if (textWords.some((word) => word.startsWith(normalQuery))) return SCORES.wordStart;
  if (normalText.includes(normalQuery)) return SCORES.contains;

  // البحث بأكثر من كلمة: كم كلمة منها موجودة؟
  const found = queryWords.filter((word) => textWords.some((textWord) => textWord.includes(word))).length;
  if (found === queryWords.length) return SCORES.allWords;
  if (found > 0) return Math.round(SCORES.someWords * (found / queryWords.length));

  // أخطاء إملائية بسيطة: خطأ واحد أقرب من خطأين
  const typos = queryWords.map((word) => typoDistance(word, textWords)).filter((distance) => distance !== null);
  if (typos.length > 0) {
    const closeness = typos.reduce((sum, distance) => sum + (distance === 1 ? 1 : 0.6), 0);
    return Math.round(SCORES.typo * (closeness / queryWords.length));
  }

  return 0;
}

/**
 * ترتيب عناصر حسب قربها من البحث.
 * fields: [{ get: (item) => نص أو قائمة نصوص, weight: أهمية الحقل (1 = عادي) }]
 * يرجع العناصر المطابقة فقط مع درجتها: [{ item, score }] من الأقرب للأبعد
 */
export function rankItems(items, query, fields) {
  if (toWords(query).length === 0) return [];

  return items
    .map((item, index) => {
      // أعلى درجة بين كل الحقول
      const score = Math.max(
        0,
        ...fields.flatMap(({ get, weight = 1 }) => {
          const values = [get(item)].flat().filter(Boolean);
          return values.map((value) => scoreText(query, value) * weight);
        })
      );

      return { item, score, index };
    })
    .filter((result) => result.score > 0)
    // نفس الدرجة: يبقى الترتيب الأصلي (الأحدث أولًا)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item, score }) => ({ item, score }));
}

/**
 * تقسيم النص لأجزاء عادية وأجزاء مطابقة للبحث (لتلوينها بـ <mark>)
 * "React hooks" + "hook" ← [{ text: "React " }, { text: "hook", isMatch: true }, { text: "s" }]
 */
export function highlightParts(text = "", query = "") {
  const words = toWords(query).filter((word) => word.length >= 2 || toWords(query).length === 1);
  if (words.length === 0) return [{ text }];

  // النص بعد التوحيد مع مكان كل حرف في النص الأصلي
  const chars = [...text];
  let normal = "";
  const positions = [];

  chars.forEach((char, index) => {
    const value = normalizeChar(char);
    normal += value;
    // مكان لكل وحدة في النص الموحّد (الإيموجي مثل 👇 تأخذ وحدتين)
    for (let i = 0; i < value.length; i++) positions.push(index);
  });

  // الأحرف المطابقة
  const marked = new Array(chars.length).fill(false);

  words.forEach((word) => {
    let start = normal.indexOf(word);

    while (start !== -1) {
      for (let i = start; i < start + word.length; i++) marked[positions[i]] = true;
      start = normal.indexOf(word, start + word.length);
    }
  });

  // التشكيل بين حرفين مطابقين يُعتبر مطابقًا أيضًا
  chars.forEach((char, index) => {
    if (!normalizeChar(char) && marked[index - 1]) marked[index] = true;
  });

  // جمع الأحرف المتتالية في أجزاء
  const parts = [];

  chars.forEach((char, index) => {
    const last = parts.at(-1);
    if (last && last.isMatch === marked[index]) last.text += char;
    else parts.push({ text: char, isMatch: marked[index] });
  });

  return parts;
}
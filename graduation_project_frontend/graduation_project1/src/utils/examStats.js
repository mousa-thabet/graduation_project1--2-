// إحصائيات الامتحان لصاحبه: كم حدا قدّمه، معدّل العلامات، وأصعب سؤال
// الآن: محاولات الطلاب الثانيين محاكاة (ثابتة لكل امتحان)، ومحاولتي الحقيقية بتنضاف عليهم
// لاحقًا: كل المحاولات بتيجي من السيرفر

// رقم ثابت من نص (نفس الامتحان = نفس الأرقام كل مرة)
function hashOf(text) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

// أرقام عشوائية ثابتة (Mulberry32): نفس البذرة = نفس السلسلة
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * محاولات الطلاب (محاكاة): كل محاولة = رقم الخيار اللي اختاره بكل سؤال (أو null).
 * كل سؤال إله صعوبة ثابتة، فبيطلع "أصعب سؤال" منطقي.
 */
function simulatedAttempts(exam) {
  const random = seededRandom(hashOf(exam.id));
  const count = 8 + Math.floor(random() * 30);
  // احتمال الإجابة الصحيحة بكل سؤال: بين 35% و 92%
  const ease = exam.questions.map(() => 0.35 + random() * 0.57);

  return Array.from({ length: count }, () =>
    exam.questions.map((question, index) => {
      if (random() < 0.04) return null;
      if (random() < ease[index]) return question.answer;

      const wrong = question.options.map((_, optionIndex) => optionIndex).filter((i) => i !== question.answer);
      // الغلط بيميل لخيار واحد (مثل الواقع: في جواب غلط "مشهور")
      return random() < 0.6 ? wrong[0] : wrong[Math.floor(random() * wrong.length)];
    })
  );
}

// فئات توزيع العلامات (نسبة مئوية)
export const SCORE_BANDS = [
  { id: "low", min: 0, max: 49 },
  { id: "mid", min: 50, max: 69 },
  { id: "good", min: 70, max: 84 },
  { id: "top", min: 85, max: 100 },
];

/**
 * إحصائيات امتحان واحد.
 * myResult: نتيجتي (إن قدّمته) بتنضاف للمحاولات
 * يرجع: { takers, average, passRate, bands: { low, mid, good, top }, questions: [...], hardestIndex }
 * questions[i]: { correctRate, commonWrong (رقم أكثر خيار غلط أو null) }
 */
export function getExamStats(exam, myResult) {
  const attempts = simulatedAttempts(exam);
  if (myResult) attempts.push(myResult.answers);

  const total = exam.questions.length;
  const percents = attempts.map(
    (answers) => (answers.filter((answer, index) => answer === exam.questions[index].answer).length / total) * 100
  );

  const bands = Object.fromEntries(SCORE_BANDS.map((band) => [band.id, 0]));
  percents.forEach((percent) => {
    const band = SCORE_BANDS.find((item) => Math.round(percent) <= item.max);
    bands[band.id] += 1;
  });

  const questions = exam.questions.map((question, index) => {
    const chosen = attempts.map((answers) => answers[index]);
    const correct = chosen.filter((answer) => answer === question.answer).length;

    // أكثر خيار غلط اختاروه
    const wrongCounts = {};
    chosen.forEach((answer) => {
      if (answer !== null && answer !== undefined && answer !== question.answer) {
        wrongCounts[answer] = (wrongCounts[answer] ?? 0) + 1;
      }
    });
    const commonWrong = Object.entries(wrongCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      correctRate: Math.round((correct / attempts.length) * 100),
      commonWrong: commonWrong === undefined ? null : Number(commonWrong),
    };
  });

  const hardestIndex = questions.reduce(
    (hardest, question, index) => (question.correctRate < questions[hardest].correctRate ? index : hardest),
    0
  );

  return {
    takers: attempts.length,
    average: Math.round(percents.reduce((sum, value) => sum + value, 0) / attempts.length),
    passRate: Math.round((percents.filter((value) => value >= 50).length / attempts.length) * 100),
    bands,
    questions,
    hardestIndex,
  };
}
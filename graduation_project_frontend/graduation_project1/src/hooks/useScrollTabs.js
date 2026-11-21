import { useEffect, useRef, useState } from "react";

/**
 * تبويبات أعرض من الشاشة (مثل تبويبات البروفايل على الموبايل):
 * - تعرف إذا في تبويبات مخفية يمين أو يسار، حتى نظهر تدرّجًا على ذاك الطرف (يبين إنها بتتمرر)
 * - التبويب المختار بيتحرك لنص الشريط لما يتغير
 * activeKey: التبويب المختار حاليًا، count: عدد التبويبات (حسابي فيه تبويبات أكثر من حساب غيري)
 * بترجع ref لعنصر التبويبات، وكلاسات التدرّج (فاضية إذا كل التبويبات ظاهرة)
 */
export function useScrollTabs(activeKey, count) {
  const ref = useRef(null);
  const [fade, setFade] = useState({ left: false, right: false });

  // حساب الأطراف من مكان أول وآخر تبويب (بيشتغل بالعربي والإنجليزي بنفس الطريقة)
  useEffect(() => {
    const list = ref.current;
    if (!list) return;

    function update() {
      const first = list.firstElementChild;
      const last = list.lastElementChild;
      if (!first || !last) return;

      const box = list.getBoundingClientRect();
      const a = first.getBoundingClientRect();
      const b = last.getBoundingClientRect();
      const left = Math.min(a.left, b.left) < box.left - 1;
      const right = Math.max(a.right, b.right) > box.right + 1;

      setFade((current) => (current.left === left && current.right === right ? current : { left, right }));
    }

    update();
    list.addEventListener("scroll", update, { passive: true });
    // تغيّر عرض الشاشة أو اللغة (النصوص بتصير أطول أو أقصر)
    const observer = new ResizeObserver(update);
    observer.observe(list);
    for (const tab of list.children) observer.observe(tab);

    return () => {
      list.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [count]);

  // التبويب المختار لنص الشريط (أفقيًا بس، بدون ما تتحرك الصفحة لفوق أو لتحت)
  useEffect(() => {
    const list = ref.current;
    const tab = list?.querySelector('[aria-selected="true"]');
    if (!tab || list.scrollWidth <= list.clientWidth) return;

    const box = list.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    const offset = rect.left + rect.width / 2 - (box.left + box.width / 2);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    list.scrollBy({ left: offset, behavior: smooth ? "smooth" : "auto" });
  }, [activeKey]);

  const fadeClass = `${fade.left ? "has-more-left" : ""} ${fade.right ? "has-more-right" : ""}`.trim();

  return { ref, fadeClass };
}
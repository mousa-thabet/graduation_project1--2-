import { useEffect, useRef } from "react";

/**
 * مزامنة بين التبويبات: لما تبويب ثاني (مثل لوحة الأدمن) يغيّر نفس المفتاح بـ localStorage،
 * المتصفح بيبعت حدث storage لباقي التبويبات، فبنعيد قراءة البيانات هون.
 * key: مفتاح التخزين  •  onChange(): إعادة القراءة
 * لاحقًا: بدل هاد بيجي تحديث من السيرفر (WebSocket أو كل كم ثانية)
 */
export function useStorageSync(key, onChange) {
  const onChangeRef = useRef(onChange);

  // آخر نسخة من الدالة بدون ما نعيد تسجيل الحدث
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === key) onChangeRef.current();
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);
}

/**
 * إشعار بقرار الأدمن مرة وحدة بس:
 * الأدمن بيحط isNotified: false على الطلب لما يقرر، وأول ما يشوفه صاحب الطلب
 * (هلأ أو لما يرجع يفتح الموقع) بيوصله إشعار وبيصير isNotified: true.
 * items: الطلبات أو البلاغات  •  onDecision(item): إرسال الإشعار  •  setItems: لتحديث الحالة
 */
export function useDecisionNotices(items, onDecision, setItems) {
  const onDecisionRef = useRef(onDecision);
  // اللي بعتنا إشعاره (حتى ما يتكرر لو الـ effect اشتغل مرتين)
  const sentRef = useRef(new Set());

  useEffect(() => {
    onDecisionRef.current = onDecision;
  });

  useEffect(() => {
    const fresh = items.filter((item) => item.isNotified === false && !sentRef.current.has(item.id));
    if (fresh.length === 0) return;

    fresh.forEach((item) => {
      sentRef.current.add(item.id);
      onDecisionRef.current?.(item);
    });

    setItems((current) =>
      current.map((item) => (sentRef.current.has(item.id) && item.isNotified === false ? { ...item, isNotified: true } : item))
    );
  }, [items, setItems]);
}
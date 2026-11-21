import { useEffect, useState } from "react";
import { getMedia } from "../utils/mediaStore.js";

// ملف ثابت من مجلد public (مثل فيديوهات الدورات التجريبية): رقمه هو رابطه، ومش محفوظ بـ IndexedDB
export const isStaticMedia = (mediaId) => typeof mediaId === "string" && mediaId.startsWith("/");

/**
 * رابط مؤقت (blob) لملف محفوظ في IndexedDB، مثل فيديو درس.
 * يرجع: { url, isLoading }  •  mediaId فاضي = ما في ملف
 * الرابط يُحذف من الذاكرة لما يتغير الملف أو نطلع من الصفحة.
 * mediaId بيبلّش بـ "/": ملف ثابت من public، فبنرجّع الرابط زي ما هو.
 */
export function useMediaUrl(mediaId) {
  const [state, setState] = useState({ mediaId: null, url: null });
  const isStatic = isStaticMedia(mediaId);

  useEffect(() => {
    if (!mediaId || isStatic) return;
    let url = null;
    let isCancelled = false;

    getMedia(mediaId)
      .then((file) => {
        if (isCancelled) return;
        url = file ? URL.createObjectURL(file) : null;
        setState({ mediaId, url });
      })
      .catch(() => {
        if (!isCancelled) setState({ mediaId, url: null });
      });

    return () => {
      isCancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mediaId, isStatic]);

  if (isStatic) return { url: mediaId, isLoading: false };

  // نتيجة ملف قديم ما بتنفع للملف الجديد
  const isCurrent = state.mediaId === mediaId;

  return { url: isCurrent ? state.url : null, isLoading: Boolean(mediaId) && !isCurrent };
}
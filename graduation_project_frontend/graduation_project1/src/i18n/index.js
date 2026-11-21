import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ar from "../locales/ar.json";
import en from "../locales/en.json";
import arStudyApp from "../locales/ar/studyApp.json";
import enStudyApp from "../locales/en/studyApp.json";
import arCommunity from "../locales/ar/community.json";
import enCommunity from "../locales/en/community.json";
import arAdmin from "../locales/ar/admin.json";
import enAdmin from "../locales/en/admin.json";
import arInfo from "../locales/ar/info.json";
import enInfo from "../locales/en/info.json";
import arStudio from "../locales/ar/studio.json";
import enStudio from "../locales/en/studio.json";
import arBranches from "../locales/ar/branches.json";
import enBranches from "../locales/en/branches.json";
import arUploads from "../locales/ar/uploads.json";
import enUploads from "../locales/en/uploads.json";
import arLibrary from "../locales/ar/library.json";
import enLibrary from "../locales/en/library.json";
import arModeration from "../locales/ar/moderation.json";
import enModeration from "../locales/en/moderation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // كل قسم كبير له ملف ترجمة خاص يُدمج مع الملف الرئيسي
    resources: {
      ar: {
        translation: {
          ...ar,
          studyApp: arStudyApp,
          community: arCommunity,
          admin: arAdmin,
          info: arInfo,
          studio: arStudio,
          branches: arBranches,
          uploads: arUploads,
          library: arLibrary,
          moderation: arModeration,
        },
      },
      en: {
        translation: {
          ...en,
          studyApp: enStudyApp,
          community: enCommunity,
          admin: enAdmin,
          info: enInfo,
          studio: enStudio,
          branches: enBranches,
          uploads: enUploads,
          library: enLibrary,
          moderation: enModeration,
        },
      },
    },
    supportedLngs: ["ar", "en"],
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
  });

// تحديث لغة الصفحة واتجاهها وعنوانها مع كل تغيير للغة
function updateDocument(language) {
  document.documentElement.lang = language;
  document.documentElement.dir = i18n.dir(language);
  document.title = i18n.t("meta.title");
}

updateDocument(i18n.resolvedLanguage);
i18n.on("languageChanged", updateDocument);

export default i18n;
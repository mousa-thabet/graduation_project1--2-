// تخزين الصور والفيديوهات والأصوات داخل المتصفح باستخدام IndexedDB
// قاعدة بيانات حقيقية في المتصفح تتحمّل الملفات الكبيرة (localStorage لا يتحملها)

const DB_NAME = "areatk-media";
const STORE_NAME = "files";

// فتح قاعدة البيانات (وإنشاؤها أول مرة)
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// تنفيذ عملية واحدة على المخزن وإرجاع نتيجتها
async function runRequest(mode, action) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const store = database.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function saveMedia(id, file) {
  return runRequest("readwrite", (store) => store.put(file, id));
}

export function getMedia(id) {
  return runRequest("readonly", (store) => store.get(id));
}

export function deleteMedia(id) {
  return runRequest("readwrite", (store) => store.delete(id));
}
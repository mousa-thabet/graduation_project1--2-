// صورة واجهة البث (مثل يوتيوب): نصغّرها إلى 640×360 قبل حفظها
// حتى تبقى خفيفة (حوالي 50 كيلوبايت) وتُحفظ مع التسجيل في localStorage

const WIDTH = 640;
const HEIGHT = 360;
// أكبر حجم مسموح للصورة المرفوعة
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * يرسم الصورة أو لقطة الفيديو على canvas بقياس 16:9 ويقص الزوائد (مثل object-fit: cover)،
 * ويرجعها نصًا (data URL) بصيغة JPEG.
 * source: صورة (ImageBitmap) أو عنصر <video> (لقطة من الكاميرا)
 */
export function makeThumbnail(source) {
  const sourceWidth = source.videoWidth ?? source.width;
  const sourceHeight = source.videoHeight ?? source.height;
  const scale = Math.max(WIDTH / sourceWidth, HEIGHT / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.getContext("2d").drawImage(source, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);

  return canvas.toDataURL("image/jpeg", 0.82);
}

// صورة من جهاز المستخدم ← صورة واجهة جاهزة
export async function thumbnailFromFile(file) {
  const image = await createImageBitmap(file);
  const thumbnail = makeThumbnail(image);
  image.close();
  return thumbnail;
}
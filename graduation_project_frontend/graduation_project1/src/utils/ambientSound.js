// توليد الأصوات المحيطة داخل المتصفح باستخدام Web Audio API
// لا نحتاج ملفات صوتية: كل صوت يُبنى من "ضجيج" مع فلاتر

let audioContext = null;
const bufferCache = {};

// سياق صوتي واحد للموقع كله
function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }

  // المتصفح يوقف الصوت حتى يتفاعل المستخدم، فنعيد تشغيله
  if (audioContext.state === "suspended") audioContext.resume();

  return audioContext;
}

// إنشاء مقطع ضجيج طوله 4 ثوانٍ يتكرر بلا توقف
function createBuffer(context, type) {
  const length = context.sampleRate * 4;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    if (type === "white") {
      data[i] = white;
    } else if (type === "pink") {
      // ضجيج وردي: أنعم من الأبيض، يشبه المطر
      b0 = 0.997 * b0 + white * 0.029591;
      b1 = 0.985 * b1 + white * 0.032534;
      b2 = 0.95 * b2 + white * 0.048056;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.9;
    } else if (type === "brown") {
      // ضجيج بني: عميق، يشبه الأمواج والهدير
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      // طقطقة متفرقة: قطرات المطر أو خشب المدفأة
      data[i] = Math.random() < 0.0012 ? white * (0.4 + Math.random() * 0.6) : 0;
    }
  }

  return buffer;
}

function getBuffer(context, type) {
  if (!bufferCache[type]) bufferCache[type] = createBuffer(context, type);
  return bufferCache[type];
}

/**
 * وصفة كل صوت: طبقات من الضجيج، لكل طبقة فلتر وقوة
 * وتذبذب بطيء (lfo) اختياري يجعل الصوت يتحرك مثل الموج والريح.
 */
const RECIPES = {
  rain: [
    { noise: "pink", filter: { type: "highpass", frequency: 900 }, gain: 0.6 },
    { noise: "crackle", filter: { type: "highpass", frequency: 2500 }, gain: 0.5 },
  ],
  waves: [
    {
      noise: "brown",
      filter: { type: "lowpass", frequency: 700 },
      gain: 0.8,
      lfo: { target: "gain", rate: 0.12, depth: 0.55 },
    },
  ],
  wind: [
    {
      noise: "pink",
      filter: { type: "bandpass", frequency: 500, q: 0.8 },
      gain: 1.4,
      lfo: { target: "frequency", rate: 0.08, depth: 300 },
    },
  ],
  fire: [
    { noise: "brown", filter: { type: "lowpass", frequency: 400 }, gain: 0.6 },
    { noise: "crackle", filter: { type: "bandpass", frequency: 1600, q: 0.7 }, gain: 1.2 },
  ],
  stream: [
    {
      noise: "pink",
      filter: { type: "bandpass", frequency: 1300, q: 0.5 },
      gain: 0.9,
      lfo: { target: "gain", rate: 0.9, depth: 0.15 },
    },
  ],
  brown: [{ noise: "brown", filter: { type: "lowpass", frequency: 1000 }, gain: 0.8 }],
  white: [{ noise: "white", filter: { type: "lowpass", frequency: 9000 }, gain: 0.18 }],
};

/**
 * صوت مولَّد من وصفة.
 * يرجع كائنًا فيه setVolume و stop (نفس واجهة الملفات المرفوعة).
 */
export function createAmbientSound(recipeName) {
  const context = getAudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const runningNodes = [];

  RECIPES[recipeName].forEach((layer) => {
    const source = context.createBufferSource();
    source.buffer = getBuffer(context, layer.noise);
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = layer.filter.type;
    filter.frequency.value = layer.filter.frequency;
    if (layer.filter.q) filter.Q.value = layer.filter.q;

    const layerGain = context.createGain();
    layerGain.gain.value = layer.gain;

    source.connect(filter);
    filter.connect(layerGain);
    layerGain.connect(master);

    // تذبذب بطيء يحرّك القوة أو التردد
    if (layer.lfo) {
      const oscillator = context.createOscillator();
      const depth = context.createGain();

      oscillator.frequency.value = layer.lfo.rate;
      depth.gain.value = layer.lfo.depth;
      oscillator.connect(depth);
      depth.connect(layer.lfo.target === "gain" ? layerGain.gain : filter.frequency);
      oscillator.start();
      runningNodes.push(oscillator);
    }

    // نبدأ من نقطة عشوائية حتى لا تتطابق الطبقات
    source.start(0, Math.random() * 3);
    runningNodes.push(source);
  });

  return {
    setVolume(volume) {
      master.gain.setTargetAtTime(volume, context.currentTime, 0.15);
    },
    stop() {
      // نخفض الصوت تدريجيًا ثم نوقفه
      master.gain.setTargetAtTime(0, context.currentTime, 0.15);
      setTimeout(() => {
        runningNodes.forEach((node) => node.stop());
        master.disconnect();
      }, 700);
    },
  };
}

// صوت من ملف رفعه الطالب
export function createFileSound(src) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.play().catch(() => {});

  return {
    setVolume(volume) {
      audio.volume = Math.min(1, volume);
    },
    stop() {
      audio.pause();
      audio.src = "";
    },
  };
}

// تنبيه لطيف عند انتهاء الدراسة أو الاستراحة
export function playChime() {
  const context = getAudioContext();
  const now = context.currentTime;

  [660, 880].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.22;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 1.3);
  });
}
import { useEffect, useRef, useState } from "react";

import {
  createAmbientSound,
  createFileSound,
} from "../utils/ambientSound.js";

const DEFAULT_VOLUME = 0.5;

export function useSoundMixer(sounds) {
  const [volumes, setVolumes] = useState({});
  const [isMuted, setIsMuted] = useState(false);

  // الأصوات المشغلة حاليًا.
  const soundsRef = useRef({});

  // آخر مستوى صوت اختاره المستخدم.
  const savedVolumesRef = useRef({});

  const isMutedRef = useRef(false);

  // آخر قائمة للأصوات المتاحة.
  const listRef = useRef(sounds);
  listRef.current = sounds;

  function startSound(id) {
    const sound = listRef.current.find(
      (item) => item.id === id
    );

    if (!sound || soundsRef.current[id]) return;

    const volume =
      savedVolumesRef.current[id] ?? DEFAULT_VOLUME;

    const created = sound.recipe
      ? createAmbientSound(sound.recipe)
      : createFileSound(sound.src);

    created.setVolume(
      isMutedRef.current ? 0 : volume
    );

    soundsRef.current[id] = created;

    setVolumes((current) => ({
      ...current,
      [id]: volume,
    }));
  }

  function stopSound(id) {
    soundsRef.current[id]?.stop();

    delete soundsRef.current[id];

    setVolumes(({ [id]: _removed, ...rest }) => rest);
  }

  function toggle(sound) {
    if (soundsRef.current[sound.id]) {
      stopSound(sound.id);
    } else {
      startSound(sound.id);
    }
  }

  // تشغيل الأصوات المحددة فقط.
  function setActive(ids) {
    Object.keys(soundsRef.current)
      .filter((id) => !ids.includes(id))
      .forEach(stopSound);

    ids.forEach(startSound);
  }

  function setVolume(id, volume) {
    savedVolumesRef.current[id] = volume;

    if (!isMutedRef.current) {
      soundsRef.current[id]?.setVolume(volume);
    }

    setVolumes((current) => ({
      ...current,
      [id]: volume,
    }));
  }

  function toggleMute() {
    const nextMuted = !isMutedRef.current;

    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    Object.entries(soundsRef.current).forEach(
      ([id, sound]) => {
        sound.setVolume(
          nextMuted
            ? 0
            : savedVolumesRef.current[id] ?? DEFAULT_VOLUME
        );
      }
    );
  }

  function stopAll() {
    Object.keys(soundsRef.current).forEach(stopSound);
  }

  // إيقاف أي صوت انحذف من قائمة الأصوات المتاحة.
  useEffect(() => {
    Object.keys(soundsRef.current)
      .filter(
        (id) => !sounds.some((sound) => sound.id === id)
      )
      .forEach(stopSound);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sounds]);

  // إيقاف الأصوات عند الخروج من القسم.
  useEffect(() => {
    const playing = soundsRef.current;

    return () => {
      Object.values(playing).forEach((sound) => {
        sound.stop();
      });
    };
  }, []);

  return {
    sounds,
    volumes,
    isMuted,
    activeCount: Object.keys(volumes).length,
    isPlaying: (id) => id in volumes,
    toggle,
    setActive,
    setVolume,
    toggleMute,
    stopAll,
  };
}
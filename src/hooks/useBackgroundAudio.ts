import { useRef, useCallback, useEffect } from "react";

interface UseBackgroundAudioOptions {
  defaultVolume?: number;
}

export function useBackgroundAudio(options: UseBackgroundAudioOptions = {}) {
  const { defaultVolume = 0.3 } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = false;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const play = useCallback(
    (url: string, volume: number = defaultVolume, loop: boolean = false) => {
      if (!audioRef.current) return;

      audioRef.current.src = url;
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
      audioRef.current.play().catch((err) => {
        console.warn("[useBackgroundAudio] Failed to play:", err);
      });
    },
    [defaultVolume],
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const fadeOut = useCallback((duration: number = 1000) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const startVolume = audio.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      const newVolume = startVolume - volumeStep * currentStep;

      if (currentStep >= steps || newVolume <= 0) {
        audio.volume = 0;
        audio.pause();
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      } else {
        audio.volume = newVolume;
      }
    }, stepDuration);
  }, []);

  const fadeIn = useCallback(
    (url: string, targetVolume: number = defaultVolume, duration: number = 1000, loop: boolean = false) => {
      if (!audioRef.current) return;

      const audio = audioRef.current;
      audio.src = url;
      audio.volume = 0;
      audio.loop = loop;

      audio.play().catch((err) => {
        console.warn("[useBackgroundAudio] Failed to play:", err);
        return;
      });

      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = targetVolume / steps;
      let currentStep = 0;

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }

      fadeIntervalRef.current = window.setInterval(() => {
        currentStep++;
        const newVolume = volumeStep * currentStep;

        if (currentStep >= steps) {
          audio.volume = targetVolume;
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
        } else {
          audio.volume = Math.min(newVolume, targetVolume);
        }
      }, stepDuration);
    },
    [defaultVolume],
  );

  const playTransitionSound = useCallback(
    (url: string, volume: number = 0.5) => {
      const transitionAudio = new Audio(url);
      transitionAudio.volume = volume;
      transitionAudio.play().catch((err) => {
        console.warn("[useBackgroundAudio] Failed to play transition:", err);
      });
    },
    [],
  );

  return {
    play,
    pause,
    stop,
    setVolume,
    fadeOut,
    fadeIn,
    playTransitionSound,
  };
}

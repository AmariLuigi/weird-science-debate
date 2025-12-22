import { useCallback, useEffect, useState, useRef } from "react";

interface AudioEngineState {
  isReady: boolean;
  currentTime: number;
  duration: number;
  analyserNode: AnalyserNode | null;
}

interface UseAudioEngineOptions {
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

// Singleton audio engine state - persists across component re-renders
let globalAudio: HTMLAudioElement | null = null;
let globalAudioContext: AudioContext | null = null;
let globalAnalyser: AnalyserNode | null = null;
let globalSource: MediaElementAudioSourceNode | null = null;
let isGlobalInitialized = false;

// Event callback refs that can be updated
let onEndedCallback: (() => void) | undefined;
let onTimeUpdateCallback:
  | ((currentTime: number, duration: number) => void)
  | undefined;

function initializeGlobalAudio() {
  if (isGlobalInitialized) return;

  console.log("[AudioEngine] Initializing global audio engine...");

  // Create audio element
  globalAudio = new Audio();

  // Set up event listeners
  globalAudio.addEventListener("ended", () => {
    console.log("[AudioEngine] Audio ended");
    onEndedCallback?.();
  });

  globalAudio.addEventListener("timeupdate", () => {
    if (globalAudio) {
      onTimeUpdateCallback?.(
        globalAudio.currentTime,
        globalAudio.duration || 0,
      );
    }
  });

  globalAudio.addEventListener("loadedmetadata", () => {
    console.log(
      "[AudioEngine] Metadata loaded, duration:",
      globalAudio?.duration,
    );
  });

  globalAudio.addEventListener("canplaythrough", () => {
    console.log(
      "[AudioEngine] Can play through, readyState:",
      globalAudio?.readyState,
    );
  });

  globalAudio.addEventListener("error", () => {
    const error = globalAudio?.error;
    console.error("[AudioEngine] Audio error:", {
      code: error?.code,
      message: error?.message,
      src: globalAudio?.src?.substring(0, 100),
    });
  });

  globalAudio.addEventListener("playing", () => {
    console.log("[AudioEngine] Audio is now playing");
  });

  globalAudio.addEventListener("pause", () => {
    console.log("[AudioEngine] Audio paused");
  });

  // Create audio context and analyser
  globalAudioContext = new AudioContext();
  globalAnalyser = globalAudioContext.createAnalyser();
  globalAnalyser.fftSize = 256;
  globalAnalyser.smoothingTimeConstant = 0.8;

  // Connect source to analyser to destination
  globalSource = globalAudioContext.createMediaElementSource(globalAudio);
  globalSource.connect(globalAnalyser);
  globalAnalyser.connect(globalAudioContext.destination);

  console.log("[AudioEngine] Global audio engine initialized");
  isGlobalInitialized = true;
}

export function useAudioEngine(options: UseAudioEngineOptions = {}) {
  const { onEnded, onTimeUpdate } = options;

  const [state, setState] = useState<AudioEngineState>({
    isReady: isGlobalInitialized,
    currentTime: 0,
    duration: 0,
    analyserNode: globalAnalyser,
  });

  // Keep track of current URL to avoid reloading
  const currentUrlRef = useRef<string | null>(null);
  const pendingPlayRef = useRef(false);

  // Update global callbacks when options change
  useEffect(() => {
    onEndedCallback = onEnded;
    onTimeUpdateCallback = onTimeUpdate;
  }, [onEnded, onTimeUpdate]);

  // Initialize on mount
  const initialize = useCallback(() => {
    if (!isGlobalInitialized) {
      initializeGlobalAudio();
      setState({
        isReady: true,
        currentTime: 0,
        duration: 0,
        analyserNode: globalAnalyser,
      });
    }
  }, []);

  // Load a new audio source
  const loadAudio = useCallback(
    (url: string) => {
      initialize();

      if (!globalAudio) {
        console.warn("[AudioEngine] No audio element available");
        return;
      }

      // Skip if same URL already loaded
      if (currentUrlRef.current === url && globalAudio.src === url) {
        console.log("[AudioEngine] URL already loaded, skipping");
        return;
      }

      console.log("[AudioEngine] Loading audio:", url.substring(0, 60));
      currentUrlRef.current = url;
      pendingPlayRef.current = false;

      // Pause current playback
      globalAudio.pause();

      // Set new source
      globalAudio.src = url;
      globalAudio.load();

      // Resume context if suspended
      if (globalAudioContext?.state === "suspended") {
        console.log("[AudioEngine] Resuming suspended audio context");
        globalAudioContext.resume();
      }
    },
    [initialize],
  );

  // Play audio
  const play = useCallback(async () => {
    if (!globalAudio) {
      console.warn("[AudioEngine] No audio element to play");
      return;
    }

    if (!globalAudio.src || globalAudio.src === window.location.href) {
      console.warn("[AudioEngine] No audio source set");
      return;
    }

    console.log(
      "[AudioEngine] Play requested, readyState:",
      globalAudio.readyState,
    );

    try {
      // Resume context if suspended
      if (globalAudioContext?.state === "suspended") {
        console.log("[AudioEngine] Resuming audio context before play");
        await globalAudioContext.resume();
      }

      // readyState: 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
      if (globalAudio.readyState >= 2) {
        console.log("[AudioEngine] Audio ready, playing now");
        await globalAudio.play();
      } else {
        // Wait for audio to be ready
        console.log("[AudioEngine] Waiting for audio to be ready...");
        pendingPlayRef.current = true;

        const playWhenReady = async () => {
          if (pendingPlayRef.current && globalAudio) {
            console.log("[AudioEngine] Audio now ready, playing");
            pendingPlayRef.current = false;
            try {
              await globalAudio.play();
            } catch (err) {
              console.error("[AudioEngine] Error playing after ready:", err);
            }
          }
        };

        globalAudio.addEventListener("canplay", playWhenReady, { once: true });
      }
    } catch (error) {
      console.error("[AudioEngine] Error playing audio:", error);
    }
  }, []);

  // Pause audio
  const pause = useCallback(() => {
    if (globalAudio) {
      console.log("[AudioEngine] Pausing");
      pendingPlayRef.current = false;
      globalAudio.pause();
    }
  }, []);

  // Stop and reset audio
  const stop = useCallback(() => {
    if (globalAudio) {
      console.log("[AudioEngine] Stopping");
      pendingPlayRef.current = false;
      globalAudio.pause();
      globalAudio.currentTime = 0;
    }
  }, []);

  // Seek to position
  const seek = useCallback((time: number) => {
    if (globalAudio) {
      globalAudio.currentTime = time;
    }
  }, []);

  // Set playback rate (speed)
  const setPlaybackRate = useCallback((rate: number) => {
    if (globalAudio) {
      // Clamp rate between 0.5 and 2.0
      const clampedRate = Math.max(0.5, Math.min(2.0, rate));
      console.log("[AudioEngine] Setting playback rate:", clampedRate);
      globalAudio.playbackRate = clampedRate;
    }
  }, []);

  // Update state periodically when playing
  useEffect(() => {
    if (!globalAudio) return;

    const updateState = () => {
      setState((prev) => ({
        ...prev,
        currentTime: globalAudio?.currentTime || 0,
        duration: globalAudio?.duration || 0,
      }));
    };

    globalAudio.addEventListener("timeupdate", updateState);
    globalAudio.addEventListener("loadedmetadata", updateState);

    return () => {
      globalAudio?.removeEventListener("timeupdate", updateState);
      globalAudio?.removeEventListener("loadedmetadata", updateState);
    };
  }, []);

  // NOTE: We intentionally do NOT clean up the global audio on unmount
  // This prevents issues with React Strict Mode and component re-renders

  return {
    ...state,
    loadAudio,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    initialize,
    analyserNode: globalAnalyser,
    audioElement: globalAudio,
  };
}

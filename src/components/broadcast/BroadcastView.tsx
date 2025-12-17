import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebate } from "@/context/DebateContext";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Header } from "@/components/layout/Header";
import { ActiveSpeakerView } from "./ActiveSpeakerView";
import { PlaybackControls } from "./PlaybackControls";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SubtitleCue } from "@/types/debate";
import { getCurrentCue } from "@/lib/srtParser";

export function BroadcastView() {
  const {
    state,
    setViewMode,
    setIsPlaying,
    setCurrentTurnIndex,
    nextTurn,
    resetPlayback,
  } = useDebate();

  const [isFinished, setIsFinished] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleCue | null>(
    null,
  );
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const hasAutoStartedRef = useRef(false);
  const subtitleIntervalRef = useRef<number | null>(null);

  const currentTurn = state.turns[state.currentTurnIndex];

  // Determine if current turn is a host turn
  const isHostTurn = currentTurn?.isHostTurn ?? false;

  // Determine if current turn uses video (host turn with video, no separate audio)
  const isVideoTurn =
    isHostTurn && !!currentTurn?.videoUrl && !currentTurn?.audioUrl;

  // Get current participant (null for host turns)
  const currentParticipant = isHostTurn
    ? null
    : state.participants.find((p) => p.id === currentTurn?.participantId);

  // Get current speaker name (either participant or host)
  const currentSpeakerName = isHostTurn
    ? state.host.name
    : currentParticipant?.name;

  // Handle audio/video ended - advance to next turn
  const handleMediaEnded = useCallback(() => {
    console.log("[BroadcastView] Media ended callback");
    setCurrentSubtitle(null);
    if (state.currentTurnIndex < state.turns.length - 1) {
      nextTurn();
    } else {
      setIsPlaying(false);
      setIsFinished(true);
    }
  }, [state.currentTurnIndex, state.turns.length, nextTurn, setIsPlaying]);

  // Handle video time update for subtitles
  const handleVideoTimeUpdate = useCallback(
    (currentTime: number, _duration: number) => {
      setVideoCurrentTime(currentTime);
    },
    [],
  );

  const {
    loadAudio,
    play,
    pause,
    stop,
    analyserNode,
    initialize,
    audioElement,
  } = useAudioEngine({
    onEnded: handleMediaEnded,
  });

  // Initialize audio engine once on mount
  useEffect(() => {
    console.log("[BroadcastView] Initializing audio engine");
    initialize();
  }, [initialize]);

  // Subtitle tracking for audio-based turns
  useEffect(() => {
    // Clear any existing interval
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }

    const subtitles = currentTurn?.subtitles;
    if (!subtitles || subtitles.length === 0 || !state.isPlaying) {
      setCurrentSubtitle(null);
      return;
    }

    // For video turns, use videoCurrentTime state
    if (isVideoTurn) {
      const cue = getCurrentCue(subtitles, videoCurrentTime);
      setCurrentSubtitle(cue);
      return;
    }

    // For audio turns, poll the audio element
    subtitleIntervalRef.current = window.setInterval(() => {
      if (audioElement) {
        const currentTime = audioElement.currentTime;
        const cue = getCurrentCue(subtitles, currentTime);
        setCurrentSubtitle(cue);
      }
    }, 100); // Update every 100ms for smooth subtitle transitions

    return () => {
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
      }
    };
  }, [
    currentTurn?.subtitles,
    state.isPlaying,
    audioElement,
    isVideoTurn,
    videoCurrentTime,
  ]);

  // Load and play audio when turn changes (only for non-video turns)
  useEffect(() => {
    // Skip audio loading for video-based turns
    if (isVideoTurn) {
      console.log("[BroadcastView] Video turn - skipping audio engine");
      return;
    }

    const audioUrl = currentTurn?.audioUrl;
    if (!audioUrl) {
      console.log("[BroadcastView] No audio URL for current turn");
      return;
    }

    console.log(
      "[BroadcastView] Turn changed, loading audio for turn:",
      state.currentTurnIndex,
      isHostTurn ? "(host)" : "(participant)",
    );

    // Clear subtitle when changing turns
    setCurrentSubtitle(null);

    // Load the audio
    loadAudio(audioUrl);

    // Play if we're supposed to be playing
    if (state.isPlaying) {
      // Give a moment for the audio to load
      const timer = setTimeout(() => {
        console.log("[BroadcastView] Playing after load");
        play();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    currentTurn?.id,
    currentTurn?.audioUrl,
    loadAudio,
    play,
    state.isPlaying,
    state.currentTurnIndex,
    isHostTurn,
    isVideoTurn,
  ]);

  // Auto-start on first mount
  useEffect(() => {
    if (
      !hasAutoStartedRef.current &&
      (currentTurn?.audioUrl || currentTurn?.videoUrl)
    ) {
      hasAutoStartedRef.current = true;
      console.log("[BroadcastView] Auto-starting playback on mount");

      // For video turns, just set playing state - VideoVisualizer handles playback
      if (isVideoTurn) {
        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
        return;
      }

      // For audio turns, load and play
      if (currentTurn?.audioUrl) {
        const timer = setTimeout(() => {
          loadAudio(currentTurn.audioUrl!);
          setTimeout(() => {
            setIsPlaying(true);
            play();
          }, 200);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, []); // Empty deps - only run once on mount

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isFinished) {
      setIsFinished(false);
      setCurrentTurnIndex(0);
      setIsPlaying(true);
    } else if (state.isPlaying) {
      // For video turns, VideoVisualizer handles pause via isPlaying prop
      if (!isVideoTurn) {
        pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // For video turns, VideoVisualizer handles play via isPlaying prop
      if (!isVideoTurn) {
        play();
      }
    }
  }, [
    isFinished,
    state.isPlaying,
    pause,
    play,
    setIsPlaying,
    setCurrentTurnIndex,
    isVideoTurn,
  ]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (!isVideoTurn) {
      stop();
    }
    resetPlayback();
    setIsFinished(false);
    setCurrentTurnIndex(0);
    setCurrentSubtitle(null);
  }, [stop, resetPlayback, setCurrentTurnIndex, isVideoTurn]);

  // Handle back to setup
  const handleBackToSetup = useCallback(() => {
    if (!isVideoTurn) {
      stop();
    }
    resetPlayback();
    setIsFinished(false);
    setCurrentSubtitle(null);
    setViewMode("config");
  }, [stop, resetPlayback, setViewMode, isVideoTurn]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        {/* Animated ambient lights */}
        <motion.div
          animate={{
            opacity: state.isPlaying ? [0.15, 0.25, 0.15] : 0.1,
            scale: state.isPlaying ? [1, 1.2, 1] : 1,
            x: state.isPlaying ? [0, 50, 0] : 0,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: isHostTurn
              ? "radial-gradient(circle, rgba(2, 89, 81, 0.3) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(12, 242, 93, 0.3) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            opacity: state.isPlaying ? [0.1, 0.2, 0.1] : 0.05,
            scale: state.isPlaying ? [1, 1.3, 1] : 1,
            y: state.isPlaying ? [0, -30, 0] : 0,
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] translate-x-1/3 translate-y-1/3 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(2, 115, 94, 0.25) 0%, transparent 70%)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
        />

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Header with title */}
      <Header title={state.title || "Live Debate"} showLogo={false} />

      {/* Main broadcast title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2 pb-4 relative z-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold">
          <span className="gradient-brand-text">{state.title || "Debate"}</span>
        </h1>
        {state.isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
            <span className="text-xs text-red-400 font-medium uppercase tracking-wider">
              Live
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <ActiveSpeakerView
              participants={state.participants}
              host={state.host}
              activeParticipantId={
                state.isPlaying && !isHostTurn
                  ? currentTurn?.participantId || null
                  : null
              }
              isHostActive={state.isPlaying && isHostTurn}
              analyserNode={isVideoTurn ? null : analyserNode}
              currentSubtitle={currentSubtitle}
              isPlaying={state.isPlaying}
              currentTurnVideoUrl={currentTurn?.videoUrl}
              onVideoEnded={handleMediaEnded}
              onVideoTimeUpdate={handleVideoTimeUpdate}
            />
          ) : (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block p-6 bg-gradient-to-br from-brand-sea/20 to-primary/20 rounded-full mb-6"
              >
                <Trophy className="w-16 h-16 text-primary" />
              </motion.div>
              <h2 className="text-3xl font-bold gradient-brand-text mb-4">
                Debate Complete!
              </h2>
              <p className="text-slate-400 mb-8">
                All {state.turns.length} speaking turns have concluded.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="secondary" onClick={handleRestart}>
                  Replay Debate
                </Button>
                <Button onClick={handleBackToSetup}>Back to Setup</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playback Controls */}
      {!isFinished && (
        <div className="p-6 pt-0 relative z-10">
          <div className="max-w-4xl mx-auto">
            <PlaybackControls
              isPlaying={state.isPlaying}
              currentTurnIndex={state.currentTurnIndex}
              totalTurns={state.turns.length}
              onPlayPause={handlePlayPause}
              onRestart={handleRestart}
              onBackToSetup={handleBackToSetup}
              currentTurnTitle={currentTurn?.title}
              currentSpeakerName={currentSpeakerName}
              isHostTurn={isHostTurn}
            />
          </div>
        </div>
      )}
    </div>
  );
}

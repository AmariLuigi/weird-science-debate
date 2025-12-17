import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebate } from "@/context/DebateContext";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Header } from "@/components/layout/Header";
import { ActiveSpeakerView } from "./ActiveSpeakerView";
import { PlaybackControls } from "./PlaybackControls";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SubtitleCue, DebateTurn } from "@/types/debate";
import { getCurrentCue } from "@/lib/srtParser";

// Helper to get all audio URLs and their subtitles for a turn
function getTurnAudioData(
  turn: DebateTurn,
): Array<{ url: string; subtitles?: SubtitleCue[] }> {
  const audioData: Array<{ url: string; subtitles?: SubtitleCue[] }> = [];

  // Legacy single audio first
  if (turn.audioUrl) {
    audioData.push({
      url: turn.audioUrl,
      subtitles: turn.subtitles,
    });
  }

  // Then audio tracks in order
  if (turn.audioTracks) {
    turn.audioTracks.forEach((track) => {
      if (track.audioUrl) {
        audioData.push({
          url: track.audioUrl,
          subtitles: track.subtitles,
        });
      }
    });
  }

  return audioData;
}

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
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const hasAutoStartedRef = useRef(false);
  const subtitleIntervalRef = useRef<number | null>(null);

  const currentTurn = state.turns[state.currentTurnIndex];

  // Determine if current turn is a host turn
  const isHostTurn = currentTurn?.isHostTurn ?? false;

  // Determine if current turn uses video (host turn with video, no separate audio)
  const audioData = currentTurn ? getTurnAudioData(currentTurn) : [];
  const hasAudioTracks = audioData.length > 0;
  const isVideoTurn = isHostTurn && !!currentTurn?.videoUrl && !hasAudioTracks;

  // Get current audio being played
  const currentAudioData = audioData[currentAudioIndex];
  const totalAudioTracks = audioData.length;

  // Get current participant (null for host turns)
  const currentParticipant = isHostTurn
    ? null
    : state.participants.find((p) => p.id === currentTurn?.participantId);

  // Get current speaker name (either participant or host)
  const currentSpeakerName = isHostTurn
    ? state.host.name
    : currentParticipant?.name;

  // Handle when a single audio track ends
  const handleAudioEnded = useCallback(() => {
    console.log(
      "[BroadcastView] Audio ended, track",
      currentAudioIndex + 1,
      "of",
      totalAudioTracks,
    );

    setCurrentSubtitle(null);

    // Check if there are more audio tracks in this turn
    if (currentAudioIndex < totalAudioTracks - 1) {
      // Move to next audio track
      console.log("[BroadcastView] Moving to next audio track");
      setCurrentAudioIndex((prev) => prev + 1);
    } else {
      // All audio tracks finished, move to next turn
      console.log(
        "[BroadcastView] All audio tracks finished, moving to next turn",
      );
      setCurrentAudioIndex(0); // Reset for next turn
      if (state.currentTurnIndex < state.turns.length - 1) {
        nextTurn();
      } else {
        setIsPlaying(false);
        setIsFinished(true);
      }
    }
  }, [
    currentAudioIndex,
    totalAudioTracks,
    state.currentTurnIndex,
    state.turns.length,
    nextTurn,
    setIsPlaying,
  ]);

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
    onEnded: handleAudioEnded,
  });

  // Initialize audio engine once on mount
  useEffect(() => {
    console.log("[BroadcastView] Initializing audio engine");
    initialize();
  }, [initialize]);

  // Reset audio index when turn changes
  useEffect(() => {
    console.log("[BroadcastView] Turn changed, resetting audio index");
    setCurrentAudioIndex(0);
  }, [currentTurn?.id]);

  // Subtitle tracking for audio-based turns
  useEffect(() => {
    // Clear any existing interval
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }

    // Get current subtitles based on which audio is playing
    const subtitles = currentAudioData?.subtitles;
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
    currentAudioData?.subtitles,
    state.isPlaying,
    audioElement,
    isVideoTurn,
    videoCurrentTime,
  ]);

  // Load and play audio when turn changes or audio index changes (only for non-video turns)
  useEffect(() => {
    // Skip audio loading for video-based turns
    if (isVideoTurn) {
      console.log("[BroadcastView] Video turn - skipping audio engine");
      return;
    }

    const audioUrl = currentAudioData?.url;
    if (!audioUrl) {
      console.log("[BroadcastView] No audio URL for current track");
      return;
    }

    console.log(
      "[BroadcastView] Loading audio track",
      currentAudioIndex + 1,
      "of",
      totalAudioTracks,
      "for turn:",
      state.currentTurnIndex,
      isHostTurn ? "(host)" : "(participant)",
    );

    // Clear subtitle when changing tracks
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
    currentAudioIndex,
    currentAudioData?.url,
    loadAudio,
    play,
    state.isPlaying,
    state.currentTurnIndex,
    isHostTurn,
    isVideoTurn,
    totalAudioTracks,
  ]);

  // Auto-start on first mount
  useEffect(() => {
    if (
      !hasAutoStartedRef.current &&
      (hasAudioTracks || currentTurn?.videoUrl)
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
      if (currentAudioData?.url) {
        const timer = setTimeout(() => {
          loadAudio(currentAudioData.url);
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
      setCurrentAudioIndex(0);
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
    setCurrentAudioIndex(0);
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
    setCurrentAudioIndex(0);
    setViewMode("config");
  }, [stop, resetPlayback, setViewMode, isVideoTurn]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        {/* Secondary ambient light - bottom right corner */}
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

      {/* Main broadcast title - offset by rail width to center over stage */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2 pb-4 relative z-10"
        style={{ paddingLeft: "var(--broadcast-rail-width)" }}
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
              {totalAudioTracks > 1 && (
                <span className="ml-2 text-slate-500">
                  (Track {currentAudioIndex + 1}/{totalAudioTracks})
                </span>
              )}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Main content area - must give full dimensions for grid layout */}
      <div className="flex-1 relative z-10 w-full">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <div className="w-full h-full">
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
                onVideoEnded={handleAudioEnded}
                onVideoTimeUpdate={handleVideoTimeUpdate}
              />
            </div>
          ) : (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
              style={{ paddingLeft: "var(--broadcast-rail-width)" }}
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
        <div
          className="p-6 pt-0 relative z-10"
          style={{ paddingLeft: "var(--broadcast-rail-width)" }}
        >
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
            {/* Audio track indicator */}
            {totalAudioTracks > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                {audioData.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentAudioIndex
                        ? "bg-primary scale-125"
                        : idx < currentAudioIndex
                          ? "bg-primary/50"
                          : "bg-slate-600"
                    }`}
                  />
                ))}
                <span className="ml-2 text-xs text-slate-500">
                  Audio {currentAudioIndex + 1} of {totalAudioTracks}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

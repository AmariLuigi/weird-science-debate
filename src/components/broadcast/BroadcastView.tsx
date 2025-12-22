import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useBackgroundAudio } from "@/hooks/useBackgroundAudio";
import { Header } from "@/components/layout/Header";
import { ActiveSpeakerView } from "./ActiveSpeakerView";
import { PlaybackControls } from "./PlaybackControls";
import { IntroSequence } from "./IntroSequence";
import { OutroSequence } from "./OutroSequence";
import { TimerDisplay, DebateTimer } from "./TimerDisplay";
import { Scoreboard } from "./Scoreboard";
import { Button } from "@/components/ui/Button";
import { SubtitleCue, DebateTurn, TURN_TYPE_CONFIGS } from "@/types/debate";
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

// Standard wrapper component for horizontal 16:9 layout - defined outside to prevent recreation
function StandardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
      {/* Dark background that fills the rest */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      {/* Centered horizontal container */}
      <div
        className="relative w-full h-full max-w-screen overflow-hidden"
        style={{ aspectRatio: '16/9', maxHeight: 'calc(100vw * 9 / 16)' }}
      >
        {children}
      </div>
    </div>
  );
}

// Shorts wrapper component for vertical 9:16 layout - defined outside to prevent recreation
function ShortsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
      {/* Dark background that fills the rest */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      {/* Centered vertical container */}
      <div
        className="relative w-full h-full max-h-screen overflow-hidden"
        style={{ aspectRatio: '9/16', maxWidth: 'calc(100vh * 9 / 16)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function BroadcastView() {
  const {
    state,
    setViewMode,
    setIsPlaying,
    setCurrentTurnIndex,
    nextTurn,
    resetPlayback,
    setBroadcastPhase,
    getGroupForTurn,
    getPlayOrderTurns,
  } = useDebate();

  const [isFinished, setIsFinished] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleCue | null>(
    null,
  );
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [turnElapsedTime, setTurnElapsedTime] = useState(0);
  const [debateElapsedTime, setDebateElapsedTime] = useState(0);
  const [isPlayingDecisionVideo, setIsPlayingDecisionVideo] = useState(false);
  const [decisionVideoUrl, setDecisionVideoUrl] = useState<string | null>(null);
  const [isPlayingScoreboardAnimation, setIsPlayingScoreboardAnimation] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const subtitleIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const debateStartTimeRef = useRef<number | null>(null);
  const turnStartTimeRef = useRef<number | null>(null);
  const prevTurnIndexRef = useRef<number>(-1);

  const backgroundAudio = useBackgroundAudio();

  const { introOutroConfig, broadcastPhase, videoFormat } = state;
  const isShorts = videoFormat === "shorts";

  // Get turns in correct playback order (groups first, then ungrouped)
  const orderedTurns = useMemo(() => getPlayOrderTurns(), [getPlayOrderTurns]);

  // Use ordered turns for playback
  const currentTurn = orderedTurns[state.currentTurnIndex];

  // Determine if current turn is a host turn
  const isHostTurn = currentTurn?.isHostTurn ?? false;

  // Determine if current turn uses video (host turn with video, no separate audio)
  const audioData = currentTurn ? getTurnAudioData(currentTurn) : [];
  const hasAudioTracks = audioData.length > 0;
  const isVideoTurn = isHostTurn && !!currentTurn?.videoUrl && !hasAudioTracks;

  // Debug: Log turn detection
  console.log("[BroadcastView] Turn detection:", {
    turnIndex: state.currentTurnIndex,
    isHostTurn,
    hasVideoUrl: !!currentTurn?.videoUrl,
    hasAudioTracks,
    audioDataLength: audioData.length,
    isVideoTurn,
    turnTitle: currentTurn?.title,
  });

  // Get topic image from Question Group (Shorts mode)
  const currentGroup = currentTurn ? getGroupForTurn(currentTurn.id) : undefined;
  const topicImageUrl = currentGroup?.imageUrl;

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

  // Calculate participant-only turn metrics
  const totalParticipantTurns = orderedTurns.filter((t) => !t.isHostTurn).length;
  const currentParticipantTurnCount = orderedTurns
    .slice(0, state.currentTurnIndex + 1)
    .filter((t) => !t.isHostTurn).length;

  // Determine label for the turn counter
  const turnLabel = isHostTurn
    ? "Host Speaking"
    : `Turn ${currentParticipantTurnCount} of ${totalParticipantTurns}`;

  // Helper to move to next turn or finish
  const moveToNextTurnOrFinish = useCallback(() => {
    if (state.currentTurnIndex < orderedTurns.length - 1) {
      if (introOutroConfig.transitionSoundUrl) {
        backgroundAudio.playTransitionSound(
          introOutroConfig.transitionSoundUrl,
          introOutroConfig.transitionSoundVolume,
        );
      }
      nextTurn();
    } else {
      setIsPlaying(false);
      if (introOutroConfig.enableOutro) {
        setBroadcastPhase("outro");
      } else {
        setIsFinished(true);
      }
    }
  }, [
    state.currentTurnIndex,
    orderedTurns.length,
    nextTurn,
    setIsPlaying,
    introOutroConfig,
    backgroundAudio,
    setBroadcastPhase,
  ]);

  // Handle when a single audio track ends
  const handleAudioEnded = useCallback(() => {
    console.log(
      "[BroadcastView] Audio ended, track",
      currentAudioIndex + 1,
      "of",
      totalAudioTracks,
    );

    setCurrentSubtitle(null);

    if (currentAudioIndex < totalAudioTracks - 1) {
      console.log("[BroadcastView] Moving to next audio track");
      setCurrentAudioIndex((prev) => prev + 1);
    } else {
      console.log(
        "[BroadcastView] All audio tracks finished",
      );
      setCurrentAudioIndex(0);

      // Check if current turn has a decision and group has decision video
      const group = currentTurn ? getGroupForTurn(currentTurn.id) : undefined;
      const decision = currentTurn?.decision;
      let videoUrl: string | undefined;

      if (decision === 'positive' && group?.positiveVideoUrl) {
        videoUrl = group.positiveVideoUrl;
      } else if (decision === 'negative' && group?.negativeVideoUrl) {
        videoUrl = group.negativeVideoUrl;
      }

      if (videoUrl && decision) {
        console.log("[BroadcastView] Starting scoreboard animation, then decision video:", decision);

        // First, trigger scoreboard animation
        setIsPlayingScoreboardAnimation(true);

        // After animation completes (1.5s), play decision video
        setTimeout(() => {
          setIsPlayingScoreboardAnimation(false);
          setDecisionVideoUrl(videoUrl!);
          setIsPlayingDecisionVideo(true);
        }, 1500);
      } else {
        // No decision video, move to next turn
        moveToNextTurnOrFinish();
      }
    }
  }, [
    currentAudioIndex,
    totalAudioTracks,
    currentTurn,
    getGroupForTurn,
    moveToNextTurnOrFinish,
  ]);

  // Handle when decision video ends
  const handleDecisionVideoEnded = useCallback(() => {
    console.log("[BroadcastView] Decision video ended");
    setIsPlayingDecisionVideo(false);
    setDecisionVideoUrl(null);
    moveToNextTurnOrFinish();
  }, [moveToNextTurnOrFinish]);

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
    setPlaybackRate,
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

  // Timer tracking for turn and debate elapsed time
  useEffect(() => {
    if (broadcastPhase !== "debate" || !state.isPlaying) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    if (!debateStartTimeRef.current) {
      debateStartTimeRef.current = Date.now() - debateElapsedTime * 1000;
    }

    if (prevTurnIndexRef.current !== state.currentTurnIndex) {
      turnStartTimeRef.current = Date.now();
      setTurnElapsedTime(0);
      prevTurnIndexRef.current = state.currentTurnIndex;
    }

    if (!turnStartTimeRef.current) {
      turnStartTimeRef.current = Date.now();
    }

    timerIntervalRef.current = window.setInterval(() => {
      const now = Date.now();
      if (turnStartTimeRef.current) {
        setTurnElapsedTime((now - turnStartTimeRef.current) / 1000);
      }
      if (debateStartTimeRef.current) {
        setDebateElapsedTime((now - debateStartTimeRef.current) / 1000);
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [broadcastPhase, state.isPlaying, state.currentTurnIndex, debateElapsedTime]);

  // Handle intro completion
  const handleIntroComplete = useCallback(() => {
    console.log("[BroadcastView] Intro complete, starting debate");
    backgroundAudio.fadeOut(500);
    setBroadcastPhase("debate");
    debateStartTimeRef.current = Date.now();
    turnStartTimeRef.current = Date.now();

    setTimeout(() => {
      setIsPlaying(true);
      if (!isVideoTurn && currentAudioData?.url) {
        loadAudio(currentAudioData.url);
        setTimeout(() => play(), 100);
      }
    }, 300);
  }, [backgroundAudio, setBroadcastPhase, setIsPlaying, isVideoTurn, currentAudioData, loadAudio, play]);

  // Handle outro replay
  const handleOutroReplay = useCallback(() => {
    backgroundAudio.stop();
    resetPlayback();
    setIsFinished(false);
    setCurrentAudioIndex(0);
    setTurnElapsedTime(0);
    setDebateElapsedTime(0);
    debateStartTimeRef.current = null;
    turnStartTimeRef.current = null;
    prevTurnIndexRef.current = -1;
  }, [backgroundAudio, resetPlayback]);

  // Start intro music when in intro phase
  useEffect(() => {
    if (broadcastPhase === "intro" && introOutroConfig.introMusicUrl) {
      backgroundAudio.fadeIn(
        introOutroConfig.introMusicUrl,
        introOutroConfig.introMusicVolume,
        1000,
        true,
      );
    }
    return () => {
      if (broadcastPhase === "intro") {
        backgroundAudio.stop();
      }
    };
  }, [broadcastPhase, introOutroConfig, backgroundAudio]);

  // Start outro music when in outro phase
  useEffect(() => {
    if (broadcastPhase === "outro" && introOutroConfig.outroMusicUrl) {
      backgroundAudio.fadeIn(
        introOutroConfig.outroMusicUrl,
        introOutroConfig.outroMusicVolume,
        1000,
        true,
      );
    }
  }, [broadcastPhase, introOutroConfig, backgroundAudio]);

  // Get expected duration for current turn
  const expectedTurnDuration = currentTurn?.turnType
    ? TURN_TYPE_CONFIGS[currentTurn.turnType]?.expectedDuration || 0
    : 0;

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

    // Set playback rate from turn settings
    const speed = currentTurn?.audioSpeed || 1.0;
    setPlaybackRate(speed);
    console.log("[BroadcastView] Set audio speed:", speed);

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
    currentTurn?.audioSpeed,
    currentAudioIndex,
    currentAudioData?.url,
    loadAudio,
    setPlaybackRate,
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
    backgroundAudio.stop();
    if (!isVideoTurn) {
      stop();
    }
    resetPlayback();
    setIsFinished(false);
    setCurrentTurnIndex(0);
    setCurrentAudioIndex(0);
    setCurrentSubtitle(null);
    setTurnElapsedTime(0);
    setDebateElapsedTime(0);
    debateStartTimeRef.current = null;
    turnStartTimeRef.current = null;
    prevTurnIndexRef.current = -1;
  }, [stop, resetPlayback, setCurrentTurnIndex, isVideoTurn, backgroundAudio]);

  // Handle back to setup
  const handleBackToSetup = useCallback(() => {
    backgroundAudio.stop();
    if (!isVideoTurn) {
      stop();
    }
    resetPlayback();
    setIsFinished(false);
    setCurrentSubtitle(null);
    setCurrentAudioIndex(0);
    setViewMode("config");
  }, [stop, resetPlayback, setViewMode, isVideoTurn, backgroundAudio]);

  // Render intro sequence
  if (broadcastPhase === "intro" && introOutroConfig.enableIntro) {
    const introContent = (
      <IntroSequence
        title={state.title}
        participants={state.participants}
        host={state.host}
        turns={state.turns}
        onComplete={handleIntroComplete}
        introMusicUrl={introOutroConfig.introMusicUrl}
        introMusicVolume={introOutroConfig.introMusicVolume}
      />
    );

    return isShorts ? <ShortsWrapper>{introContent}</ShortsWrapper> : <StandardWrapper>{introContent}</StandardWrapper>;
  }

  // Render outro sequence
  if (broadcastPhase === "outro") {
    const outroContent = (
      <OutroSequence
        title={state.title}
        participants={state.participants}
        host={state.host}
        participantTurns={totalParticipantTurns}
        onReplay={handleOutroReplay}
        onBackToSetup={handleBackToSetup}
        outroMusicUrl={introOutroConfig.outroMusicUrl}
        outroMusicVolume={introOutroConfig.outroMusicVolume}
        outroVideoUrl={introOutroConfig.outroVideoUrl}
      />
    );

    return isShorts ? <ShortsWrapper>{outroContent}</ShortsWrapper> : <StandardWrapper>{outroContent}</StandardWrapper>;
  }

  // Main debate content
  const debateContent = (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Video Background - muted, looping, autoplay */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.4) saturate(1.2)' }}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-slate-950/60" />

        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />

        {/* Ambient glow - bottom right corner */}
        <motion.div
          animate={{
            opacity: state.isPlaying ? [0.15, 0.25, 0.15] : 0.08,
            scale: state.isPlaying ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] translate-x-1/3 translate-y-1/3 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(12, 242, 93, 0.2) 0%, transparent 70%)",
          }}
        />

        {/* Ambient glow - top left */}
        <motion.div
          animate={{
            opacity: state.isPlaying ? [0.1, 0.18, 0.1] : 0.05,
            scale: state.isPlaying ? [1, 1.15, 1] : 1,
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-0 left-0 w-[500px] h-[500px] -translate-x-1/4 -translate-y-1/4 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(2, 115, 94, 0.2) 0%, transparent 70%)",
          }}
        />

        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
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
          <span className="gradient-brand-text">
            {currentTurn?.turnType
              ? TURN_TYPE_CONFIGS[currentTurn.turnType]?.label || "Speaking"
              : "Speaking"}
          </span>
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
        {/* Timer Displays */}
        {state.isPlaying && (
          <>
            <DebateTimer elapsedTime={debateElapsedTime} position="top-left" />
            {/* Turn timer hidden in Shorts mode - only show total time */}
            {!isShorts && (
              <TimerDisplay
                currentTime={turnElapsedTime}
                expectedDuration={expectedTurnDuration}
                position="top-right"
                label={turnLabel}
                showExpected={expectedTurnDuration > 0}
              />
            )}
          </>
        )}

        {/* Scoreboard - Shorts mode only, when groups have labels */}
        {isShorts && state.questionGroups.some(g => g.positiveLabel || g.negativeLabel) && (
          <div
            className="absolute bottom-24 left-0 right-0 flex justify-center z-20"
            style={{ paddingLeft: "var(--broadcast-rail-width)" }}
          >
            <Scoreboard
              questionGroups={state.questionGroups}
              turns={orderedTurns}
              participants={state.participants}
              currentTurnIndex={state.currentTurnIndex}
              triggerAnimation={isPlayingScoreboardAnimation}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <div className="w-full h-full">
              <ActiveSpeakerView
                participants={state.participants}
                host={state.host}
                activeParticipantId={
                  state.isPlaying && !isHostTurn && !isPlayingDecisionVideo
                    ? currentTurn?.participantId || null
                    : null
                }
                isHostActive={state.isPlaying && isHostTurn && !isPlayingDecisionVideo}
                analyserNode={isVideoTurn ? null : analyserNode}
                currentSubtitle={isPlayingDecisionVideo ? null : currentSubtitle}
                isPlaying={state.isPlaying}
                currentTurnVideoUrl={currentTurn?.videoUrl}
                onVideoEnded={handleAudioEnded}
                onVideoTimeUpdate={handleVideoTimeUpdate}
                isShorts={isShorts}
                topicImageUrl={isPlayingDecisionVideo ? undefined : topicImageUrl}
                isPlayingDecisionVideo={isPlayingDecisionVideo}
                decisionVideoUrl={decisionVideoUrl}
                onDecisionVideoEnded={handleDecisionVideoEnded}
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
                All {orderedTurns.length} speaking turns have concluded.
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
              participantTurnIndex={currentParticipantTurnCount}
              participantTotalTurns={totalParticipantTurns}
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
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentAudioIndex
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

  return isShorts ? <ShortsWrapper>{debateContent}</ShortsWrapper> : <StandardWrapper>{debateContent}</StandardWrapper>;
}

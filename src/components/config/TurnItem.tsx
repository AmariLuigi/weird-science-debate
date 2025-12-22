import { useState, useCallback, forwardRef, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Loader2,
  CheckCircle,
  Mic,
  FileText,
  X,
  Video,
  Plus,
  Music,
  Clock,
  AlertTriangle,
  ThumbsUp,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { DebateTurn, AudioTrack, TurnType, TURN_TYPE_CONFIGS, ParticipantDecision } from "@/types/debate";
import { useDebate } from "@/context/DebateContext";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  needsConversion,
  convertToMp3,
  ConversionProgress,
} from "@/lib/audioConverter";
import { parseSRTFile } from "@/lib/srtParser";
import {
  getAudioDuration,
  getVideoDuration,
  formatDuration,
  getTotalTurnDuration,
} from "@/lib/audioDuration";

interface TurnItemProps {
  turn: DebateTurn;
  index: number;
}

interface TrackConversionState {
  trackId: string;
  isConverting: boolean;
  progress: ConversionProgress | null;
  wasConverted: boolean;
}

// Audio Preview Player Component
interface AudioPreviewPlayerProps {
  audioUrl: string;
  speed: number;
}

function AudioPreviewPlayer({ audioUrl, speed }: AudioPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Update playback rate when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) {
      // Create audio element on first play
      audioRef.current = new Audio(audioUrl);
      audioRef.current.playbackRate = speed;

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(isNaN(prog) ? 0 : prog);
        }
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, speed, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Reset audio when URL changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setProgress(0);
    }
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handlePlayPause}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          isPlaying
            ? "bg-primary text-black hover:bg-primary/90"
            : "bg-slate-700 text-white hover:bg-slate-600"
        )}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Progress bar */}
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export const TurnItem = forwardRef<HTMLDivElement, TurnItemProps>(
  function TurnItem({ turn, index }, forwardedRef) {
    const {
      state,
      updateTurn,
      removeTurn,
      addAudioTrack,
      updateAudioTrack,
      removeAudioTrack,
      getGroupForTurn,
    } = useDebate();
    const [isConverting, setIsConverting] = useState(false);
    const [conversionProgress, setConversionProgress] =
      useState<ConversionProgress | null>(null);
    const [wasConverted, setWasConverted] = useState(false);
    const [srtError, setSrtError] = useState<string | null>(null);

    // Track conversion states for multiple audio tracks
    const [trackConversions, setTrackConversions] = useState<
      Map<string, TrackConversionState>
    >(new Map());

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: turn.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const participantOptions = state.participants.map((p) => ({
      value: p.id,
      label: p.name || "Unnamed Participant",
    }));

    const selectedParticipant = state.participants.find(
      (p) => p.id === turn.participantId,
    );

    // Helper to get all audio URLs
    const getAllAudioUrls = (): string[] => {
      const urls: string[] = [];
      if (turn.audioUrl) urls.push(turn.audioUrl);
      turn.audioTracks?.forEach((track) => {
        if (track.audioUrl) urls.push(track.audioUrl);
      });
      return urls;
    };

    // For host turns: need either video OR at least one audio
    // For participant turns: need both participant and at least one audio
    const hasAnyAudio = getAllAudioUrls().length > 0;
    const isValid = turn.isHostTurn
      ? !!(turn.videoUrl || hasAnyAudio)
      : turn.participantId && hasAnyAudio;

    // Calculate total duration for this turn
    const totalDuration = getTotalTurnDuration(turn.audioTracks, turn.duration);
    const hasTemplate = !!state.template;
    const expectedDuration = turn.turnType
      ? TURN_TYPE_CONFIGS[turn.turnType]?.expectedDuration || 0
      : 0;
    const durationDiff = expectedDuration > 0 ? totalDuration - expectedDuration : 0;
    const durationWarning =
      expectedDuration > 0 && Math.abs(durationDiff) > expectedDuration * 0.3;

    // Turn type options for select
    const turnTypeOptions = Object.values(TURN_TYPE_CONFIGS).map((config) => ({
      value: config.id,
      label: `${config.label} (${formatDuration(config.expectedDuration)})`,
    }));

    const handleAudioChange = useCallback(
      async (file: File | undefined) => {
        setWasConverted(false);

        if (!file) {
          updateTurn(turn.id, { audioFile: undefined, duration: undefined });
          return;
        }

        let finalFile = file;

        if (needsConversion(file)) {
          setIsConverting(true);
          setConversionProgress({ stage: "decoding", progress: 0 });

          try {
            const result = await convertToMp3(file, (progress) => {
              setConversionProgress(progress);
            });

            finalFile = new File([result.blob], result.convertedName, {
              type: "audio/mpeg",
            });
            setWasConverted(true);
          } catch (error) {
            console.error("Conversion failed:", error);
          } finally {
            setIsConverting(false);
            setConversionProgress(null);
          }
        }

        const duration = await getAudioDuration(finalFile);
        updateTurn(turn.id, { audioFile: finalFile, duration });
      },
      [turn.id, updateTurn],
    );

    const handleTrackAudioChange = useCallback(
      async (trackId: string, file: File | undefined) => {
        if (!file) {
          updateAudioTrack(turn.id, trackId, {
            audioFile: undefined,
            duration: undefined,
          });
          return;
        }

        let finalFile = file;

        if (needsConversion(file)) {
          setTrackConversions((prev) => {
            const newMap = new Map(prev);
            newMap.set(trackId, {
              trackId,
              isConverting: true,
              progress: { stage: "decoding", progress: 0 },
              wasConverted: false,
            });
            return newMap;
          });

          try {
            const result = await convertToMp3(file, (progress) => {
              setTrackConversions((prev) => {
                const newMap = new Map(prev);
                const current = newMap.get(trackId);
                if (current) {
                  newMap.set(trackId, { ...current, progress });
                }
                return newMap;
              });
            });

            finalFile = new File([result.blob], result.convertedName, {
              type: "audio/mpeg",
            });

            setTrackConversions((prev) => {
              const newMap = new Map(prev);
              newMap.set(trackId, {
                trackId,
                isConverting: false,
                progress: null,
                wasConverted: true,
              });
              return newMap;
            });
          } catch (error) {
            console.error("Conversion failed:", error);
            setTrackConversions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(trackId);
              return newMap;
            });
          }
        }

        const duration = await getAudioDuration(finalFile);
        updateAudioTrack(turn.id, trackId, { audioFile: finalFile, duration });
      },
      [turn.id, updateAudioTrack],
    );

    const handleVideoChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const duration = await getVideoDuration(file);
          updateTurn(turn.id, { videoFile: file, duration });
        }
      },
      [turn.id, updateTurn],
    );

    const handleRemoveVideo = useCallback(() => {
      updateTurn(turn.id, { videoFile: undefined });
    }, [turn.id, updateTurn]);

    const handleSrtChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSrtError(null);

        try {
          updateTurn(turn.id, {
            subtitleFile: file,
            subtitles: [],
          });

          const subtitles = await parseSRTFile(file);

          updateTurn(turn.id, {
            subtitleFile: file,
            subtitles,
          });
        } catch (error) {
          console.error("Failed to parse SRT file:", error);
          setSrtError("Failed to parse subtitle file");
          updateTurn(turn.id, {
            subtitleFile: undefined,
            subtitles: undefined,
          });
        }
      },
      [turn.id, updateTurn],
    );

    const handleRemoveSrt = useCallback(() => {
      updateTurn(turn.id, { subtitleFile: undefined, subtitles: undefined });
      setSrtError(null);
    }, [turn.id, updateTurn]);

    const handleTrackSrtChange = useCallback(
      async (trackId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
          const subtitles = await parseSRTFile(file);
          updateAudioTrack(turn.id, trackId, {
            subtitleFile: file,
            subtitles,
          });
        } catch (error) {
          console.error("Failed to parse SRT file:", error);
          // Don't update if parsing failed
        }
      },
      [turn.id, updateAudioTrack],
    );

    const handleRemoveTrackSrt = useCallback(
      (trackId: string) => {
        updateAudioTrack(turn.id, trackId, {
          subtitleFile: undefined,
          subtitles: undefined,
        });
      },
      [turn.id, updateAudioTrack],
    );

    const handleAddAudioTrack = useCallback(() => {
      addAudioTrack(turn.id);
    }, [turn.id, addAudioTrack]);

    const handleRemoveTrack = useCallback(
      (trackId: string) => {
        removeAudioTrack(turn.id, trackId);
        setTrackConversions((prev) => {
          const newMap = new Map(prev);
          newMap.delete(trackId);
          return newMap;
        });
      },
      [turn.id, removeAudioTrack],
    );

    const getProgressText = (progress: ConversionProgress | null) => {
      if (!progress) return "Converting...";
      switch (progress.stage) {
        case "decoding":
          return `Decoding audio... ${Math.round(progress.progress)}%`;
        case "encoding":
          return `Converting to MP3... ${Math.round(progress.progress)}%`;
        case "complete":
          return "Complete!";
        default:
          return "Converting...";
      }
    };

    const combinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        setNodeRef(node);
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [setNodeRef, forwardedRef],
    );

    const isAnyConverting =
      isConverting ||
      Array.from(trackConversions.values()).some((t) => t.isConverting);

    // Render audio track item
    const renderAudioTrack = (track: AudioTrack, trackIndex: number) => {
      const conversionState = trackConversions.get(track.id);
      const isTrackConverting = conversionState?.isConverting ?? false;
      const trackProgress = conversionState?.progress ?? null;
      const trackWasConverted = conversionState?.wasConverted ?? false;

      return (
        <div
          key={track.id}
          className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/5"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <Music className="w-4 h-4" />
            <span>#{trackIndex + 2}</span>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Audio Upload */}
            <div className="relative">
              {isTrackConverting ? (
                <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-primary/30 rounded-lg">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {getProgressText(trackProgress)}
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-brand-teal transition-all duration-300"
                        style={{
                          width: `${trackProgress?.progress || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <FileUpload
                    type="audio"
                    accept="audio/*"
                    value={track.audioFile}
                    previewUrl={track.audioUrl}
                    onChange={(file) => handleTrackAudioChange(track.id, file)}
                  />
                  {trackWasConverted && track.audioFile && (
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">MP3</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SRT Upload for track */}
            <div className="relative">
              {track.subtitleFile ? (
                <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-green-500/30 rounded-lg">
                  <FileText className="w-5 h-5 text-green-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {track.subtitleFile.name}
                    </div>
                    <div className="text-xs text-green-400">
                      {track.subtitles?.length || 0} cues
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrackSrt(track.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-white" />
                  </button>
                </div>
              ) : (
                <label className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg hover:border-green-500/50 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-400">Subtitles</div>
                    <div className="text-xs text-slate-500">.srt</div>
                  </div>
                  <input
                    type="file"
                    accept=".srt,text/srt,application/x-subrip"
                    onChange={(e) => handleTrackSrtChange(track.id, e)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Remove track button */}
          <button
            type="button"
            onClick={() => handleRemoveTrack(track.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            disabled={isTrackConverting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    };

    return (
      <div
        ref={combinedRef}
        style={style}
        className={cn(
          "relative rounded-xl border transition-all duration-300",
          isDragging
            ? "z-50 shadow-2xl opacity-90 border-primary/50"
            : "border-white/10 hover:border-white/20",
          isValid
            ? "bg-gradient-to-r from-slate-900/50 to-slate-800/50"
            : "bg-gradient-to-r from-slate-900/30 to-slate-800/30",
          turn.isHostTurn &&
          "border-l-2 border-l-brand-teal/50 bg-brand-teal/5",
        )}
      >
        <div className="flex items-start gap-4 p-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-2 -m-2 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Turn Number */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center",
              turn.isHostTurn
                ? "bg-gradient-to-br from-brand-teal/30 to-brand-sea/20"
                : "bg-gradient-to-br from-primary/20 to-brand-teal/20",
            )}
          >
            {turn.isHostTurn ? (
              <Mic className="w-4 h-4 text-brand-teal" />
            ) : (
              <span className="text-sm font-semibold text-white">
                {index + 1}
              </span>
            )}
          </div>

          {/* Turn Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Host Label for host turns */}
            {turn.isHostTurn && (
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-brand-teal/20 border border-brand-teal/30 rounded-full text-xs font-medium text-brand-teal">
                  HOST - Weird Science
                </span>
              </div>
            )}

            {/* Turn Title */}
            <TextInput
              value={turn.title}
              onChange={(e) => updateTurn(turn.id, { title: e.target.value })}
              placeholder={
                turn.isHostTurn
                  ? "Host speech title (e.g., Introduction, Closing)..."
                  : "Turn title (e.g., Opening Statement)..."
              }
              className="text-sm"
            />

            {/* Turn Type and Duration Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Turn Type Selector */}
              {hasTemplate && (
                <div className="flex items-center gap-2">
                  <Select
                    value={turn.turnType || ""}
                    onChange={(value: string) =>
                      updateTurn(turn.id, { turnType: value as TurnType })
                    }
                    placeholder="Select turn type..."
                    options={turnTypeOptions}
                  />
                </div>
              )}

              {/* Duration Display */}
              {totalDuration > 0 && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    durationWarning
                      ? "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                      : "bg-primary/20 border border-primary/30 text-primary",
                  )}
                >
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(totalDuration)}</span>
                  {expectedDuration > 0 && (
                    <span className="text-slate-400">
                      / {formatDuration(expectedDuration)}
                    </span>
                  )}
                  {durationWarning && (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  )}
                </div>
              )}

              {/* Expected duration hint when no audio yet */}
              {totalDuration === 0 && expectedDuration > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 border border-slate-600/30 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Expected: {formatDuration(expectedDuration)}</span>
                </div>
              )}
            </div>

            {/* Audio Speed & Preview - Common for all turns */}
            {(() => {
              // Get first available audio URL for preview
              const previewAudioUrl = turn.audioUrl || turn.audioTracks?.[0]?.audioUrl;

              return (
                <div className="flex items-center gap-4 py-2 px-3 bg-slate-800/30 rounded-lg">
                  {/* Speed Slider */}
                  <div className="flex items-center gap-2 flex-1">
                    <Volume2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 whitespace-nowrap">Speed:</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={turn.audioSpeed || 1}
                      onChange={(e) => updateTurn(turn.id, { audioSpeed: parseFloat(e.target.value) })}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary max-w-[100px]"
                      style={{
                        background: `linear-gradient(to right, rgb(12, 242, 93) 0%, rgb(12, 242, 93) ${((turn.audioSpeed || 1) - 0.5) / 1.5 * 100}%, rgb(51, 65, 85) ${((turn.audioSpeed || 1) - 0.5) / 1.5 * 100}%, rgb(51, 65, 85) 100%)`
                      }}
                    />
                    <span className={cn(
                      "text-xs font-medium min-w-[36px] text-center px-1.5 py-0.5 rounded",
                      (turn.audioSpeed || 1) === 1
                        ? "text-slate-400"
                        : (turn.audioSpeed || 1) > 1
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-blue-400 bg-blue-500/10"
                    )}>
                      {(turn.audioSpeed || 1).toFixed(1)}x
                    </span>
                  </div>

                  {/* Preview Player */}
                  {previewAudioUrl && (
                    <AudioPreviewPlayer
                      audioUrl={previewAudioUrl}
                      speed={turn.audioSpeed || 1}
                    />
                  )}
                </div>
              );
            })()}

            {/* Host Turn Layout - Video primary, Audio optional */}
            {turn.isHostTurn ? (
              <div className="space-y-3">
                {/* Video Upload - Primary for host */}
                <div className="relative">
                  {turn.videoUrl ? (
                    <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-brand-teal/30 rounded-lg">
                      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                        <video
                          src={turn.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {turn.videoFile?.name || (turn.videoUrl ? decodeURIComponent(turn.videoUrl.split('/').pop() || 'Video') : 'Video')}
                        </div>
                        <div className="text-xs text-brand-teal flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Video with audio will play in visualizer
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400 hover:text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-dashed border-brand-teal/40 rounded-lg hover:border-brand-teal/60 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer">
                      <div className="p-2 bg-brand-teal/20 rounded-lg">
                        <Video className="w-5 h-5 text-brand-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">Upload Video</div>
                        <div className="text-xs text-slate-400">
                          Video will play in circle with its own audio
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Divider with OR */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-700"></div>
                  <span className="text-xs text-slate-500 uppercase">
                    or use audio only
                  </span>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                {/* Primary Audio Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    {isConverting ? (
                      <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-primary/30 rounded-lg">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {getProgressText(conversionProgress)}
                          </div>
                          <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-brand-teal transition-all duration-300"
                              style={{
                                width: `${conversionProgress?.progress || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          className={cn(
                            "transition-opacity",
                            turn.videoUrl && "opacity-50 pointer-events-none",
                          )}
                        >
                          <FileUpload
                            type="audio"
                            accept="audio/*"
                            value={turn.audioFile}
                            previewUrl={turn.audioUrl}
                            onChange={handleAudioChange}
                          />
                        </div>
                        {turn.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
                            <span className="text-xs text-slate-400">
                              Using video audio
                            </span>
                          </div>
                        )}
                        {wasConverted && turn.audioFile && !turn.videoUrl && (
                          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">
                              Converted to MP3
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SRT Subtitle Upload */}
                  <div className="relative">
                    {turn.subtitleFile ? (
                      <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-green-500/30 rounded-lg">
                        <FileText className="w-5 h-5 text-green-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {turn.subtitleFile.name}
                          </div>
                          <div className="text-xs text-green-400">
                            {turn.subtitles?.length || 0} subtitle cues
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveSrt}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg hover:border-green-500/50 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-400">
                            Upload subtitles
                          </div>
                          <div className="text-xs text-slate-500">
                            .srt file
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".srt,text/srt,application/x-subrip"
                          onChange={handleSrtChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    {srtError && (
                      <div className="absolute -bottom-5 left-0 text-xs text-red-400">
                        {srtError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Audio Tracks */}
                {turn.audioTracks && turn.audioTracks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                      Additional Audio Tracks
                    </div>
                    {turn.audioTracks.map((track, trackIndex) =>
                      renderAudioTrack(track, trackIndex),
                    )}
                  </div>
                )}

                {/* Add Audio Track Button */}
                {!turn.videoUrl && (
                  <button
                    type="button"
                    onClick={handleAddAudioTrack}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/30 border border-dashed border-slate-600 rounded-lg hover:border-primary/50 hover:bg-slate-800/50 transition-all duration-300 text-sm text-slate-400 hover:text-primary"
                    disabled={isAnyConverting}
                  >
                    <Plus className="w-4 h-4" />
                    Add Audio Track
                  </button>
                )}
              </div>
            ) : (
              /* Participant Turn Layout */
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Participant Select */}
                  <div className="flex items-center gap-2">
                    {selectedParticipant?.avatarUrl && (
                      <img
                        src={selectedParticipant.avatarUrl}
                        alt={selectedParticipant.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                    )}
                    <Select
                      value={turn.participantId}
                      onChange={(value) =>
                        updateTurn(turn.id, { participantId: value })
                      }
                      options={participantOptions}
                      placeholder="Select speaker..."
                      className="flex-1"
                    />
                  </div>

                  {/* Decision Selector - Only show for turns in groups with decision videos */}
                  {(() => {
                    const group = getGroupForTurn(turn.id);
                    const hasDecisionVideos = group?.positiveVideoUrl || group?.negativeVideoUrl;
                    if (!hasDecisionVideos) return null;

                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Decision:</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => updateTurn(turn.id, { decision: turn.decision === 'positive' ? null : 'positive' as ParticipantDecision })}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                              turn.decision === 'positive'
                                ? "bg-green-500/20 border border-green-500/50 text-green-400"
                                : "bg-slate-800/50 border border-slate-600/30 text-slate-400 hover:border-green-500/30 hover:text-green-400"
                            )}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            Positive
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTurn(turn.id, { decision: turn.decision === 'negative' ? null : 'negative' as ParticipantDecision })}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                              turn.decision === 'negative'
                                ? "bg-red-500/20 border border-red-500/50 text-red-400"
                                : "bg-slate-800/50 border border-slate-600/30 text-slate-400 hover:border-red-500/30 hover:text-red-400"
                            )}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            Negative
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Primary Audio Upload with Conversion */}
                  <div className="relative">
                    {isConverting ? (
                      <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-primary/30 rounded-lg">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {getProgressText(conversionProgress)}
                          </div>
                          <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-brand-teal transition-all duration-300"
                              style={{
                                width: `${conversionProgress?.progress || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <FileUpload
                          type="audio"
                          accept="audio/*"
                          value={turn.audioFile}
                          previewUrl={turn.audioUrl}
                          onChange={handleAudioChange}
                        />
                        {wasConverted && turn.audioFile && (
                          <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">
                              Converted to MP3
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SRT Subtitle Upload */}
                  <div className="relative">
                    {turn.subtitleFile ? (
                      <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-green-500/30 rounded-lg">
                        <FileText className="w-5 h-5 text-green-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {turn.subtitleFile.name}
                          </div>
                          <div className="text-xs text-green-400">
                            {turn.subtitles?.length || 0} subtitle cues
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveSrt}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg hover:border-green-500/50 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-400">
                            Upload subtitles
                          </div>
                          <div className="text-xs text-slate-500">
                            .srt file
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".srt,text/srt,application/x-subrip"
                          onChange={handleSrtChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    {srtError && (
                      <div className="absolute -bottom-5 left-0 text-xs text-red-400">
                        {srtError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Audio Tracks for Participant */}
                {
                  turn.audioTracks && turn.audioTracks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        Additional Audio Tracks
                      </div>
                      {turn.audioTracks.map((track, trackIndex) =>
                        renderAudioTrack(track, trackIndex),
                      )}
                    </div>
                  )
                }

                {/* Add Audio Track Button for Participant */}
                <button
                  type="button"
                  onClick={handleAddAudioTrack}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/30 border border-dashed border-slate-600 rounded-lg hover:border-primary/50 hover:bg-slate-800/50 transition-all duration-300 text-sm text-slate-400 hover:text-primary"
                  disabled={isAnyConverting}
                >
                  <Plus className="w-4 h-4" />
                  Add Audio Track
                </button>
              </div>
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeTurn(turn.id)}
            className="flex-shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            disabled={isAnyConverting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  },
);

import { useState, useCallback, forwardRef } from "react";
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
} from "lucide-react";
import { DebateTurn } from "@/types/debate";
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

interface TurnItemProps {
  turn: DebateTurn;
  index: number;
}

export const TurnItem = forwardRef<HTMLDivElement, TurnItemProps>(
  function TurnItem({ turn, index }, forwardedRef) {
    const { state, updateTurn, removeTurn } = useDebate();
    const [isConverting, setIsConverting] = useState(false);
    const [conversionProgress, setConversionProgress] =
      useState<ConversionProgress | null>(null);
    const [wasConverted, setWasConverted] = useState(false);
    const [srtError, setSrtError] = useState<string | null>(null);

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

    // For host turns: need either video OR audio
    // For participant turns: need both participant and audio
    const isValid = turn.isHostTurn
      ? !!(turn.videoUrl || turn.audioUrl)
      : turn.participantId && turn.audioUrl;

    const handleAudioChange = useCallback(
      async (file: File | undefined) => {
        // Reset converted state
        setWasConverted(false);

        if (!file) {
          updateTurn(turn.id, { audioFile: undefined });
          return;
        }

        // Check if conversion is needed
        if (needsConversion(file)) {
          setIsConverting(true);
          setConversionProgress({ stage: "decoding", progress: 0 });

          try {
            const result = await convertToMp3(file, (progress) => {
              setConversionProgress(progress);
            });

            // Create a new File object from the converted blob
            const convertedFile = new File(
              [result.blob],
              result.convertedName,
              {
                type: "audio/mpeg",
              },
            );

            setWasConverted(true);
            updateTurn(turn.id, { audioFile: convertedFile });
          } catch (error) {
            console.error("Conversion failed:", error);
            // Fall back to original file
            updateTurn(turn.id, { audioFile: file });
          } finally {
            setIsConverting(false);
            setConversionProgress(null);
          }
        } else {
          // No conversion needed
          updateTurn(turn.id, { audioFile: file });
        }
      },
      [turn.id, updateTurn],
    );

    const handleVideoChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          updateTurn(turn.id, { videoFile: file });
        }
        // Reset input
        e.target.value = "";
      },
      [turn.id, updateTurn],
    );

    const handleRemoveVideo = useCallback(() => {
      updateTurn(turn.id, { videoFile: undefined });
    }, [turn.id, updateTurn]);

    const handleSrtChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSrtError(null);

        if (!file) {
          updateTurn(turn.id, {
            subtitleFile: undefined,
            subtitles: undefined,
          });
          return;
        }

        try {
          const subtitles = await parseSRTFile(file);
          if (subtitles.length === 0) {
            setSrtError("No valid subtitles found in file");
            return;
          }
          updateTurn(turn.id, { subtitleFile: file, subtitles });
        } catch (error) {
          console.error("Failed to parse SRT:", error);
          setSrtError("Failed to parse subtitle file");
        }

        // Reset input
        e.target.value = "";
      },
      [turn.id, updateTurn],
    );

    const handleRemoveSrt = useCallback(() => {
      updateTurn(turn.id, { subtitleFile: undefined, subtitles: undefined });
      setSrtError(null);
    }, [turn.id, updateTurn]);

    const getProgressText = () => {
      if (!conversionProgress) return "";
      if (conversionProgress.stage === "decoding") {
        return `Decoding audio... ${conversionProgress.progress}%`;
      }
      if (conversionProgress.stage === "encoding") {
        return `Converting to MP3... ${conversionProgress.progress}%`;
      }
      return "Complete!";
    };

    // Combine refs for both sortable and forwardRef
    const combinedRef = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    return (
      <div
        ref={combinedRef}
        style={style}
        className={cn(
          "glass-panel-light p-4 transition-all duration-200",
          isDragging && "opacity-50 shadow-2xl scale-[1.02] z-50",
          !isValid && "border-l-2 border-l-amber-500/50",
          turn.isHostTurn &&
            "border-l-2 border-l-neon-purple/50 bg-neon-purple/5",
        )}
      >
        <div className="flex items-start gap-4">
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
                ? "bg-gradient-to-br from-neon-purple/30 to-neon-pink/20"
                : "bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20",
            )}
          >
            {turn.isHostTurn ? (
              <Mic className="w-4 h-4 text-neon-purple" />
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
                <span className="px-2 py-0.5 bg-neon-purple/20 border border-neon-purple/30 rounded-full text-xs font-medium text-neon-purple">
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

            {/* Host Turn Layout - Video primary, Audio optional */}
            {turn.isHostTurn ? (
              <div className="space-y-3">
                {/* Video Upload - Primary for host */}
                <div className="relative">
                  {turn.videoUrl ? (
                    <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-neon-purple/30 rounded-lg">
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
                          {turn.videoFile?.name || "Video"}
                        </div>
                        <div className="text-xs text-neon-purple flex items-center gap-1">
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
                    <label className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-dashed border-neon-purple/40 rounded-lg hover:border-neon-purple/60 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer">
                      <div className="p-2 bg-neon-purple/20 rounded-lg">
                        <Video className="w-5 h-5 text-neon-purple" />
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

                {/* Audio Upload - Secondary for host */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    {isConverting ? (
                      <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-neon-cyan/30 rounded-lg">
                        <Loader2 className="w-5 h-5 text-neon-cyan animate-spin" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {getProgressText()}
                          </div>
                          <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
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
              </div>
            ) : (
              /* Participant Turn Layout - Original */
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

                {/* Audio Upload with Conversion */}
                <div className="relative">
                  {isConverting ? (
                    <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-neon-cyan/30 rounded-lg">
                      <Loader2 className="w-5 h-5 text-neon-cyan animate-spin" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {getProgressText()}
                        </div>
                        <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
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
                        <div className="text-xs text-slate-500">.srt file</div>
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
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeTurn(turn.id)}
            className="flex-shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            disabled={isConverting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  },
);

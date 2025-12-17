import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Settings, Volume2, Mic } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PlaybackControlsProps {
  isPlaying: boolean;
  participantTurnIndex: number;
  participantTotalTurns: number;
  onPlayPause: () => void;
  onRestart: () => void;
  onBackToSetup: () => void;
  currentTurnTitle?: string;
  currentSpeakerName?: string;
  isHostTurn?: boolean;
}

export function PlaybackControls({
  isPlaying,
  participantTurnIndex,
  participantTotalTurns,
  onPlayPause,
  onRestart,
  onBackToSetup,
  currentTurnTitle,
  currentSpeakerName,
  isHostTurn = false,
}: PlaybackControlsProps) {
  // Calculate progress using participant-only turns, excluding host turns
  const progress =
    participantTotalTurns > 0 ? (participantTurnIndex / participantTotalTurns) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-panel px-6 py-4"
    >
      <div className="flex items-center justify-between gap-6">
        {/* Left: Current Turn Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Turn</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded font-semibold text-sm",
                  isHostTurn
                    ? "bg-brand-teal/20 text-brand-sea"
                    : "bg-primary/20 text-primary",
                )}
              >
                {isHostTurn ? "Host" : `${participantTurnIndex} / ${participantTotalTurns}`}
              </span>
            </div>
            {currentSpeakerName && (
              <>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-2">
                  {isHostTurn ? (
                    <Mic className="w-4 h-4 text-brand-sea" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-primary" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      isHostTurn ? "text-brand-sea" : "text-white",
                    )}
                  >
                    {currentSpeakerName}
                  </span>
                  {isHostTurn && (
                    <span className="px-1.5 py-0.5 bg-brand-teal/20 border border-brand-teal/30 rounded text-xs text-brand-sea font-medium">
                      HOST
                    </span>
                  )}
                </div>
              </>
            )}
            {currentTurnTitle && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-sm text-slate-400 truncate">
                  {currentTurnTitle}
                </span>
              </>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full",
                isHostTurn
                  ? "bg-gradient-to-r from-brand-dark to-brand-sea"
                  : "bg-gradient-to-r from-brand-sea to-primary",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={onRestart}
            className="hover:text-primary"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayPause}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              "shadow-lg transition-all duration-300",
              isHostTurn
                ? "bg-gradient-to-r from-brand-dark to-brand-teal shadow-brand-teal/30 hover:shadow-brand-teal/50"
                : "bg-gradient-to-r from-brand-sea to-primary shadow-primary/30 hover:shadow-primary/50",
            )}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </motion.button>
        </div>

        {/* Right: Back to Setup */}
        <div className="flex-1 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToSetup}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Back to Setup
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

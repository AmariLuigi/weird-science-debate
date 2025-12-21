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
      className="glass-panel px-4 py-3"
    >
      {/* Progress bar at top */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
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

      <div className="flex items-center justify-center gap-4">
        {/* Turn Info - Compact */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">Turn</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded font-semibold text-xs",
              isHostTurn
                ? "bg-brand-teal/20 text-brand-sea"
                : "bg-primary/20 text-primary",
            )}
          >
            {isHostTurn ? "Host" : `${participantTurnIndex}/${participantTotalTurns}`}
          </span>
        </div>

        {/* Speaker Name - Compact */}
        {currentSpeakerName && (
          <>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5 min-w-0">
              {isHostTurn ? (
                <Mic className="w-3.5 h-3.5 text-brand-sea shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs font-medium truncate max-w-[80px]",
                  isHostTurn ? "text-brand-sea" : "text-white",
                )}
              >
                {currentSpeakerName}
              </span>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Playback Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="icon"
            onClick={onRestart}
            className="hover:text-primary w-8 h-8"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayPause}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "shadow-lg transition-all duration-300",
              isHostTurn
                ? "bg-gradient-to-r from-brand-dark to-brand-teal shadow-brand-teal/30 hover:shadow-brand-teal/50"
                : "bg-gradient-to-r from-brand-sea to-primary shadow-primary/30 hover:shadow-primary/50",
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </motion.button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Back to Setup */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onBackToSetup}
          className="gap-1.5 text-xs shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
          Back to Setup
        </Button>
      </div>
    </motion.div>
  );
}

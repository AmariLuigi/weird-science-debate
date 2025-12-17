import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { formatDurationLong } from "@/lib/audioDuration";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  currentTime: number;
  expectedDuration?: number;
  position?: "top-left" | "top-right";
  label?: string;
  showExpected?: boolean;
}

export function TimerDisplay({
  currentTime,
  expectedDuration = 0,
  position = "top-right",
  label,
  showExpected = true,
}: TimerDisplayProps) {
  const percentage = expectedDuration > 0 ? (currentTime / expectedDuration) * 100 : 0;
  const isWarning = percentage >= 80 && percentage < 100;
  const isOvertime = percentage >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "absolute z-30 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md",
        position === "top-right" ? "top-4 right-4" : "top-4 left-4",
        isOvertime
          ? "bg-red-500/20 border border-red-500/30"
          : isWarning
            ? "bg-amber-500/20 border border-amber-500/30"
            : "bg-black/40 border border-white/10",
      )}
    >
      <Clock
        className={cn(
          "w-4 h-4",
          isOvertime ? "text-red-400" : isWarning ? "text-amber-400" : "text-primary",
        )}
      />

      <div className="flex flex-col">
        {label && <span className="text-xs text-slate-400 leading-none mb-0.5">{label}</span>}
        <div className="flex items-baseline gap-1">
          <motion.span
            className={cn(
              "font-mono text-lg font-semibold",
              isOvertime ? "text-red-400" : isWarning ? "text-amber-400" : "text-white",
            )}
            animate={isOvertime ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {formatDurationLong(currentTime)}
          </motion.span>
          {showExpected && expectedDuration > 0 && (
            <span className="text-xs text-slate-500">
              / {formatDurationLong(expectedDuration)}
            </span>
          )}
        </div>
      </div>

      {expectedDuration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full",
              isOvertime
                ? "bg-red-500"
                : isWarning
                  ? "bg-amber-500"
                  : "bg-primary",
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </motion.div>
  );
}

interface DebateTimerProps {
  elapsedTime: number;
  position?: "top-left" | "top-right";
}

export function DebateTimer({ elapsedTime, position = "top-left" }: DebateTimerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "absolute z-30 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md bg-black/40 border border-white/10",
        position === "top-right" ? "top-4 right-4" : "top-4 left-4",
      )}
    >
      <Clock className="w-4 h-4 text-slate-400" />
      <div className="flex flex-col">
        <span className="text-xs text-slate-400 leading-none mb-0.5">Total Time</span>
        <span className="font-mono text-lg font-semibold text-white">
          {formatDurationLong(elapsedTime)}
        </span>
      </div>
    </motion.div>
  );
}

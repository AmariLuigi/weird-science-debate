import { motion } from "framer-motion";
import { Participant } from "@/types/debate";
import { CircularVisualizer } from "./CircularVisualizer";
import { cn } from "@/lib/utils";

interface ParticipantCardBroadcastProps {
  participant: Participant;
  isActive: boolean;
  analyserNode: AnalyserNode | null;
  turnTitle?: string;
}

export function ParticipantCardBroadcast({
  participant,
  isActive,
  analyserNode,
  turnTitle,
}: ParticipantCardBroadcastProps) {
  const avatarSize = 180;
  const visualizerSize = avatarSize + 80;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative flex flex-col items-center p-8 rounded-3xl transition-all duration-500",
        isActive
          ? "bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-neon-cyan/30"
          : "bg-slate-900/30 backdrop-blur-lg border border-white/5",
      )}
    >
      {/* Active indicator glow */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-3xl"
          style={{
            boxShadow:
              "0 0 60px rgba(0, 245, 255, 0.3), 0 0 100px rgba(0, 245, 255, 0.1), inset 0 0 60px rgba(0, 245, 255, 0.05)",
          }}
        />
      )}

      {/* Avatar container with visualizer */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: visualizerSize, height: visualizerSize }}
      >
        {/* Circular visualizer */}
        <CircularVisualizer
          analyserNode={analyserNode}
          isActive={isActive}
          size={visualizerSize}
        />

        {/* Avatar */}
        <motion.div
          animate={
            isActive
              ? {
                  scale: [1, 1.02, 1],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }
              : {
                  scale: [1, 1.01, 1],
                  opacity: [0.6, 0.7, 0.6],
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }
          }
          className={cn(
            "relative rounded-full overflow-hidden border-4 transition-all duration-500",
            isActive
              ? "border-neon-cyan/50 shadow-lg shadow-neon-cyan/30"
              : "border-white/10 opacity-60",
          )}
          style={{ width: avatarSize, height: avatarSize }}
        >
          {participant.avatarUrl ? (
            <img
              src={participant.avatarUrl}
              alt={participant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <span className="text-5xl font-bold text-white/30">
                {participant.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}

          {/* Active overlay glow */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-t from-neon-cyan/10 to-transparent" />
          )}
        </motion.div>
      </div>

      {/* Participant name */}
      <motion.h3
        animate={{ opacity: isActive ? 1 : 0.6 }}
        className={cn(
          "mt-6 text-2xl font-bold transition-all duration-500",
          isActive ? "text-white neon-text-cyan" : "text-slate-300",
        )}
      >
        {participant.name || "Unnamed"}
      </motion.h3>

      {/* Speaking indicator / Turn title */}
      <div className="h-8 mt-2">
        {isActive && turnTitle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full bg-neon-cyan"
            />
            <span className="text-sm text-neon-cyan font-medium">
              {turnTitle}
            </span>
          </motion.div>
        )}
        {!isActive && (
          <span className="text-sm text-slate-500">Waiting to speak...</span>
        )}
      </div>
    </motion.div>
  );
}

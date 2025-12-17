import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { Host } from "@/types/debate";
import { CircularVisualizer } from "./CircularVisualizer";
import { cn } from "@/lib/utils";

interface HostCardBroadcastProps {
  host: Host;
  isActive: boolean;
  analyserNode: AnalyserNode | null;
  turnTitle?: string;
}

export function HostCardBroadcast({
  host,
  isActive,
  analyserNode,
  turnTitle,
}: HostCardBroadcastProps) {
  const avatarSize = 140;
  const visualizerSize = avatarSize + 60;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative flex flex-col items-center p-6 rounded-2xl transition-all duration-500",
        isActive
          ? "bg-gradient-to-b from-purple-900/60 to-slate-900/60 backdrop-blur-xl border border-neon-purple/30"
          : "bg-slate-900/30 backdrop-blur-lg border border-white/5",
      )}
    >
      {/* Host badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neon-purple/20 border border-neon-purple/40 rounded-full flex items-center gap-1.5"
      >
        <Mic className="w-3 h-3 text-neon-purple" />
        <span className="text-xs font-semibold text-neon-purple uppercase tracking-wider">
          Host
        </span>
      </motion.div>

      {/* Active indicator glow */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl"
          style={{
            boxShadow:
              "0 0 60px rgba(191, 0, 255, 0.3), 0 0 100px rgba(191, 0, 255, 0.1), inset 0 0 60px rgba(191, 0, 255, 0.05)",
          }}
        />
      )}

      {/* Avatar container with visualizer */}
      <div
        className="relative flex items-center justify-center mt-2"
        style={{ width: visualizerSize, height: visualizerSize }}
      >
        {/* Circular visualizer - purple themed for host */}
        <CircularVisualizer
          analyserNode={analyserNode}
          isActive={isActive}
          size={visualizerSize}
          color="purple"
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
                  opacity: [0.7, 0.8, 0.7],
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
              ? "border-neon-purple/50 shadow-lg shadow-neon-purple/30"
              : "border-white/10 opacity-70",
          )}
          style={{ width: avatarSize, height: avatarSize }}
        >
          {host.avatarUrl ? (
            <img
              src={host.avatarUrl}
              alt={host.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center">
              <Mic className="w-12 h-12 text-white/40" />
            </div>
          )}

          {/* Active overlay glow */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/10 to-transparent" />
          )}
        </motion.div>
      </div>

      {/* Host name */}
      <motion.h3
        animate={{ opacity: isActive ? 1 : 0.7 }}
        className={cn(
          "mt-4 text-xl font-bold transition-all duration-500",
          isActive ? "text-white neon-text-purple" : "text-slate-300",
        )}
      >
        {host.name}
      </motion.h3>

      {/* Speaking indicator / Turn title */}
      <div className="h-6 mt-1">
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
              className="w-2 h-2 rounded-full bg-neon-purple"
            />
            <span className="text-sm text-neon-purple font-medium">
              {turnTitle}
            </span>
          </motion.div>
        )}
        {!isActive && (
          <span className="text-xs text-slate-500">Moderating</span>
        )}
      </div>
    </motion.div>
  );
}

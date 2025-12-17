import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Mic } from "lucide-react";
import { DebateTurn, Participant, Host } from "@/types/debate";
import { cn } from "@/lib/utils";

interface CurrentTurnOverlayProps {
  turn: DebateTurn | null;
  participant: Participant | null;
  host: Host | null;
  turnIndex: number;
  totalTurns: number;
  isPlaying: boolean;
  isHostTurn: boolean;
}

export function CurrentTurnOverlay({
  turn,
  participant,
  host,
  turnIndex,
  totalTurns,
  isPlaying,
  isHostTurn,
}: CurrentTurnOverlayProps) {
  if (!turn) return null;

  // For host turns, we need a host; for participant turns, we need a participant
  if (isHostTurn && !host) return null;
  if (!isHostTurn && !participant) return null;

  const speakerName = isHostTurn ? host?.name : participant?.name;
  const speakerAvatar = isHostTurn ? host?.avatarUrl : participant?.avatarUrl;
  const speakerId = isHostTurn ? host?.id : participant?.id;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={turn.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div
          className={cn(
            "glass-panel px-6 py-4 flex items-center gap-4",
            "border border-white/20",
            isPlaying && !isHostTurn && "border-primary/30 neon-glow-mint",
            isPlaying && isHostTurn && "border-brand-teal/30 neon-glow-teal",
          )}
        >
          {/* Turn indicator */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                isHostTurn ? "bg-brand-teal/20" : "bg-primary/20",
              )}
            >
              {isHostTurn ? (
                <Mic className="w-4 h-4 text-brand-sea" />
              ) : (
                <MessageCircle className="w-4 h-4 text-primary" />
              )}
            </div>
            <span className="text-sm text-slate-400">
              Turn {turnIndex + 1} of {totalTurns}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/20" />

          {/* Speaker info */}
          <div className="flex items-center gap-3">
            {speakerAvatar ? (
              <motion.img
                key={speakerId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={speakerAvatar}
                alt={speakerName || "Speaker"}
                className={cn(
                  "w-10 h-10 rounded-full object-cover border-2",
                  isHostTurn ? "border-brand-teal/50" : "border-primary/50",
                )}
              />
            ) : isHostTurn ? (
              <motion.div
                key="host-placeholder"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-dark to-brand-teal flex items-center justify-center border-2 border-brand-teal/50"
              >
                <Mic className="w-5 h-5 text-white/60" />
              </motion.div>
            ) : null}
            <div>
              <motion.p
                key={`name-${turn.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "font-semibold",
                  isHostTurn ? "text-brand-sea" : "text-white",
                )}
              >
                {speakerName || "Unknown Speaker"}
              </motion.p>
              {turn.title && (
                <motion.p
                  key={`title-${turn.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-slate-400"
                >
                  {turn.title}
                </motion.p>
              )}
            </div>
          </div>

          {/* Playing indicator */}
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 ml-2"
            >
              <span
                className={cn(
                  "w-1 h-3 rounded-full animate-pulse",
                  isHostTurn ? "bg-brand-teal" : "bg-primary",
                )}
              />
              <span
                className="w-1 h-4 bg-brand-green rounded-full animate-pulse"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className={cn(
                  "w-1 h-3 rounded-full animate-pulse",
                  isHostTurn ? "bg-brand-sea" : "bg-brand-green",
                )}
                style={{ animationDelay: "0.2s" }}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

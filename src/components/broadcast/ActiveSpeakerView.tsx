import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { Participant, Host, SubtitleCue } from "@/types/debate";
import { CircularVisualizer } from "./CircularVisualizer";
import { VideoVisualizer } from "./VideoVisualizer";
import { cn } from "@/lib/utils";

interface ActiveSpeakerViewProps {
  participants: Participant[];
  host: Host;
  activeParticipantId: string | null;
  isHostActive: boolean;
  analyserNode: AnalyserNode | null;
  currentSubtitle: SubtitleCue | null;
  isPlaying: boolean;
  currentTurnVideoUrl?: string; // Video URL for the current turn (if any)
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function ActiveSpeakerView({
  participants,
  host,
  activeParticipantId,
  isHostActive,
  analyserNode,
  currentSubtitle,
  isPlaying,
  currentTurnVideoUrl,
  onVideoEnded,
  onVideoTimeUpdate,
}: ActiveSpeakerViewProps) {
  // Determine who is the active speaker
  const activeSpeaker = isHostActive
    ? { type: "host" as const, data: host }
    : activeParticipantId
      ? {
          type: "participant" as const,
          data: participants.find((p) => p.id === activeParticipantId),
        }
      : null;

  // Get inactive participants (excluding the active one)
  const inactiveParticipants = participants.filter(
    (p) => p.id !== activeParticipantId,
  );

  const activeAvatarSize = 280;
  const activeVisualizerSize = activeAvatarSize + 100;
  const inactiveAvatarSize = 80;

  // Check if we should show video instead of avatar
  const hasVideo = isHostActive && currentTurnVideoUrl;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative px-8">
      {/* Inactive participants - sidebar on left */}
      <motion.div
        layout
        className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Host thumbnail when not active */}
        <AnimatePresence mode="popLayout">
          {!isHostActive && (
            <motion.div
              key="host-thumb"
              layout
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative"
            >
              <div
                className={cn(
                  "rounded-full overflow-hidden border-2 transition-all duration-300",
                  "border-brand-teal/30 opacity-60 hover:opacity-80",
                )}
                style={{
                  width: inactiveAvatarSize,
                  height: inactiveAvatarSize,
                }}
              >
                {host.avatarUrl ? (
                  <img
                    src={host.avatarUrl}
                    alt={host.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-dark to-brand-teal flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white/40" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-brand-teal/20 border border-brand-teal/30 rounded-full">
                <span className="text-[10px] font-medium text-brand-sea uppercase">
                  Host
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inactive participants */}
        <AnimatePresence mode="popLayout">
          {inactiveParticipants.map((participant, index) => (
            <motion.div
              key={participant.id}
              layout
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                transition: { delay: index * 0.05 },
              }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "rounded-full overflow-hidden border-2 transition-all duration-300",
                  "border-white/10 opacity-50 group-hover:opacity-80 group-hover:border-white/30",
                )}
                style={{
                  width: inactiveAvatarSize,
                  height: inactiveAvatarSize,
                }}
              >
                {participant.avatarUrl ? (
                  <img
                    src={participant.avatarUrl}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <span className="text-lg font-bold text-white/30">
                      {participant.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </motion.div>
              {/* Name tooltip on hover */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="px-2 py-1 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded text-xs text-white whitespace-nowrap">
                  {participant.name || "Unnamed"}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Active speaker - center stage */}
      <AnimatePresence mode="wait">
        {activeSpeaker?.data && (
          <motion.div
            key={
              activeSpeaker.type === "host"
                ? "host-active"
                : activeSpeaker.data.id
            }
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1], // Custom easing for smooth entrance
            }}
            className="flex flex-col items-center"
          >
            {/* Spotlight glow effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl",
                  isHostActive
                    ? "bg-gradient-radial from-brand-teal/20 via-brand-dark/5 to-transparent"
                    : "bg-gradient-radial from-primary/20 via-brand-green/5 to-transparent",
                )}
              />
            </motion.div>

            {/* Avatar/Video with visualizer */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: activeVisualizerSize,
                height: activeVisualizerSize,
              }}
            >
              {hasVideo ? (
                /* Video Visualizer - video plays inside the circle with audio-reactive bars */
                <VideoVisualizer
                  videoUrl={currentTurnVideoUrl}
                  isActive={isPlaying}
                  size={activeVisualizerSize}
                  color="teal"
                  isPlaying={isPlaying}
                  onEnded={onVideoEnded}
                  onTimeUpdate={onVideoTimeUpdate}
                />
              ) : (
                /* Standard Circular Visualizer with Avatar */
                <>
                  <CircularVisualizer
                    analyserNode={analyserNode}
                    isActive={isPlaying}
                    size={activeVisualizerSize}
                    color={isHostActive ? "teal" : "mint"}
                  />

                  {/* Outer glow ring */}
                  <motion.div
                    className={cn(
                      "absolute rounded-full",
                      isHostActive
                        ? "border-brand-teal/20"
                        : "border-primary/20",
                    )}
                    style={{
                      width: activeAvatarSize + 40,
                      height: activeAvatarSize + 40,
                      borderWidth: 2,
                    }}
                    animate={
                      isPlaying
                        ? {
                            scale: [1, 1.05, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Avatar */}
                  <motion.div
                    animate={
                      isPlaying
                        ? {
                            scale: [1, 1.02, 1],
                            transition: {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                        : {}
                    }
                    className={cn(
                      "relative rounded-full overflow-hidden border-4 shadow-2xl",
                      isHostActive
                        ? "border-brand-teal/60 shadow-brand-teal/40"
                        : "border-primary/60 shadow-primary/40",
                    )}
                    style={{
                      width: activeAvatarSize,
                      height: activeAvatarSize,
                    }}
                  >
                    {activeSpeaker.data.avatarUrl ? (
                      <img
                        src={activeSpeaker.data.avatarUrl}
                        alt={activeSpeaker.data.name}
                        className="w-full h-full object-cover"
                      />
                    ) : isHostActive ? (
                      <div className="w-full h-full bg-gradient-to-br from-brand-dark to-brand-teal flex items-center justify-center">
                        <Mic className="w-16 h-16 text-white/40" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <span className="text-6xl font-bold text-white/30">
                          {activeSpeaker.data.name?.charAt(0)?.toUpperCase() ||
                            "?"}
                        </span>
                      </div>
                    )}

                    {/* Overlay glow */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-t to-transparent",
                        isHostActive ? "from-brand-teal/20" : "from-primary/20",
                      )}
                    />
                  </motion.div>
                </>
              )}
            </div>

            {/* Speaker name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-6 text-center"
            >
              {isHostActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-teal/20 border border-brand-teal/40 rounded-full mb-2"
                >
                  <Mic className="w-3 h-3 text-brand-sea" />
                  <span className="text-xs font-semibold text-brand-sea uppercase tracking-wider">
                    Host
                  </span>
                </motion.div>
              )}
              <h2
                className={cn(
                  "text-3xl md:text-4xl font-bold",
                  isHostActive ? "neon-text-teal" : "neon-text-mint",
                )}
              >
                {activeSpeaker.data.name || "Unknown Speaker"}
              </h2>
            </motion.div>

            {/* Subtitle area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 max-w-3xl w-full px-4"
            >
              <AnimatePresence mode="wait">
                {currentSubtitle ? (
                  <motion.div
                    key={currentSubtitle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {/* Subtitle background */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-xl -z-10" />

                    {/* Subtitle text */}
                    <div className="px-8 py-5 text-center">
                      <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                        {currentSubtitle.text}
                      </p>
                    </div>

                    {/* Animated border */}
                    <motion.div
                      className={cn(
                        "absolute inset-0 rounded-xl border-2 pointer-events-none",
                        isHostActive
                          ? "border-brand-teal/40"
                          : "border-primary/40",
                      )}
                      animate={{
                        opacity: [0.4, 0.8, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                ) : isPlaying ? (
                  <motion.div
                    key="no-subtitle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-20 flex items-center justify-center"
                  >
                    {/* Speaking indicator dots */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            isHostActive ? "bg-brand-sea" : "bg-primary",
                          )}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-20" />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No active speaker state */}
      {!activeSpeaker?.data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-xl text-slate-400">Ready to start the debate</p>
        </motion.div>
      )}
    </div>
  );
}

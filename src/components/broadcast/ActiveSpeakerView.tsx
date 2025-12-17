import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { Participant, Host, SubtitleCue } from "@/types/debate";
import { CircularVisualizer } from "./CircularVisualizer";
import { VideoVisualizer } from "./VideoVisualizer";
import { SubtitleDisplay } from "./SubtitleDisplay";
import { cn } from "@/lib/utils";

interface ActiveSpeakerViewProps {
  participants: Participant[];
  host: Host;
  activeParticipantId: string | null;
  isHostActive: boolean;
  analyserNode: AnalyserNode | null;
  currentSubtitle: SubtitleCue | null;
  isPlaying: boolean;
  currentTurnVideoUrl?: string;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (currentTime: number, duration: number) => void;
  debugLayout?: boolean;
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
  debugLayout = false,
}: ActiveSpeakerViewProps) {
  // Determine who is the active speaker
  // When not playing, default to first participant or host
  const activeSpeaker = isHostActive
    ? { type: "host" as const, data: host }
    : activeParticipantId
      ? {
          type: "participant" as const,
          data: participants.find((p) => p.id === activeParticipantId),
        }
      : participants.length > 0
        ? {
            type: "participant" as const,
            data: participants[0],
          }
        : { type: "host" as const, data: host };

  // Get the active participant ID (either explicitly set or defaulting to first participant)
  const currentActiveParticipantId =
    activeParticipantId ||
    (participants.length > 0 ? participants[0].id : null);

  // Get inactive participants (excluding the active one)
  const inactiveParticipants = participants.filter(
    (p) => p.id !== currentActiveParticipantId,
  );

  // Determine if we're showing host as active
  const showingHostActive = isHostActive || participants.length === 0;

  // Size constants matching CSS variables
  const AVATAR_ACTIVE_SIZE = 280;
  const VISUALIZER_PADDING = 100;
  const VISUALIZER_SIZE = AVATAR_ACTIVE_SIZE + VISUALIZER_PADDING;

  // Check if we should show video instead of avatar
  const hasVideo = isHostActive && currentTurnVideoUrl;

  return (
    <div className={cn("broadcast-grid", debugLayout && "debug-layout")}>
      {/* ===== LEFT RAIL - Inactive Participants ===== */}
      <div className="broadcast-rail">
        {/* Inactive participants */}
        {inactiveParticipants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 0.6, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            className="relative group cursor-pointer"
          >
            <div className="broadcast-inactive-avatar border-2 border-white/20 group-hover:border-primary/50 transition-all duration-300">
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-brand-teal/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-white/80">
                    {participant.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* Name tooltip on hover */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg whitespace-nowrap pointer-events-none z-30"
            >
              <span className="text-sm text-white font-medium">
                {participant.name || "Unknown"}
              </span>
            </motion.div>
          </motion.div>
        ))}

        {/* Host indicator in rail when participant is active */}
        {!showingHostActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 0.5, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.3 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            className="relative group cursor-pointer mt-4"
          >
            <div className="broadcast-inactive-avatar border-2 border-brand-teal/40 group-hover:border-brand-teal transition-all duration-300">
              {host.avatarUrl ? (
                <img
                  src={host.avatarUrl}
                  alt={host.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-teal/30 to-brand-sea/30 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-brand-teal" />
                </div>
              )}
            </div>

            {/* Host label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-brand-teal/20 border border-brand-teal/40 rounded-full"
            >
              <span className="text-[9px] font-semibold text-brand-teal uppercase tracking-wider">
                Host
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* ===== CENTER STAGE - Active Speaker ===== */}
      <div className="broadcast-stage">
        <AnimatePresence mode="wait">
          {activeSpeaker?.data ? (
            <motion.div
              key={activeSpeaker.data.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="broadcast-stage-inner"
            >
              {/* Visualizer container */}
              <div className="broadcast-visualizer">
                {/* Ambient radar glow - centered using negative offset */}
                {/* Container is 380px, glow is 800px, offset = (800-380)/2 = 210px */}
                <motion.div
                  className="absolute w-[800px] h-[800px] rounded-full pointer-events-none"
                  style={{
                    top: -210,
                    left: -210,
                    background: showingHostActive
                      ? "radial-gradient(circle, rgba(2, 89, 81, 0.3) 0%, transparent 70%)"
                      : "radial-gradient(circle, rgba(12, 242, 93, 0.3) 0%, transparent 70%)",
                    zIndex: -1,
                  }}
                  animate={{
                    opacity: isPlaying ? [0.15, 0.25, 0.15] : 0.1,
                    scale: isPlaying ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {hasVideo ? (
                  <VideoVisualizer
                    videoUrl={currentTurnVideoUrl!}
                    isActive={isPlaying}
                    isPlaying={isPlaying}
                    size={VISUALIZER_SIZE}
                    onEnded={onVideoEnded}
                    onTimeUpdate={onVideoTimeUpdate}
                  />
                ) : (
                  <>
                    {/* Audio reactive visualizer */}
                    <CircularVisualizer
                      analyserNode={analyserNode}
                      isActive={isPlaying}
                      size={VISUALIZER_SIZE}
                      color={showingHostActive ? "teal" : "mint"}
                    />

                    {/* Avatar in center */}
                    <motion.div
                      className="broadcast-active-avatar border-4 border-transparent"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {activeSpeaker.data.avatarUrl ? (
                        <motion.img
                          src={activeSpeaker.data.avatarUrl}
                          alt={activeSpeaker.data.name}
                          className="w-full h-full object-cover"
                          animate={{
                            scale: isPlaying ? [1, 1.02, 1] : 1,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-full h-full flex items-center justify-center",
                            showingHostActive
                              ? "bg-gradient-to-br from-brand-teal/30 to-brand-sea/30"
                              : "bg-gradient-to-br from-primary/30 to-brand-teal/30",
                          )}
                        >
                          {showingHostActive ? (
                            <Mic className="w-20 h-20 text-brand-teal" />
                          ) : (
                            <span className="text-6xl font-bold text-white/80">
                              {activeSpeaker.data.name
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none rounded-full" />
                    </motion.div>

                    {/* Pulsing ring when playing - positioned absolutely in center */}
                    {isPlaying && (
                      <motion.div
                        className={cn(
                          "absolute rounded-full border-2 pointer-events-none",
                          showingHostActive
                            ? "border-brand-teal/30"
                            : "border-primary/30",
                        )}
                        style={{
                          width: AVATAR_ACTIVE_SIZE + 20,
                          height: AVATAR_ACTIVE_SIZE + 20,
                          top: "50%",
                          left: "50%",
                          marginTop: -(AVATAR_ACTIVE_SIZE + 20) / 2,
                          marginLeft: -(AVATAR_ACTIVE_SIZE + 20) / 2,
                        }}
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Speaker name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="broadcast-speaker-name"
              >
                {showingHostActive && (
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
                    showingHostActive ? "neon-text-teal" : "neon-text-mint",
                  )}
                >
                  {activeSpeaker.data.name || "Unknown Speaker"}
                </h2>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="no-speaker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-xl text-slate-400">
                Ready to start the debate
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== BOTTOM DOCK - Subtitles ===== */}
      <div className="broadcast-dock">
        <div className="broadcast-dock-inner">
          <SubtitleDisplay
            subtitle={currentSubtitle}
            isHost={showingHostActive}
            isPlaying={isPlaying}
          />
        </div>
      </div>
    </div>
  );
}

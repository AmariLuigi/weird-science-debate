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
  // Shorts mode props
  isShorts?: boolean;
  topicImageUrl?: string;
  // Decision video props
  isPlayingDecisionVideo?: boolean;
  decisionVideoUrl?: string | null;
  onDecisionVideoEnded?: () => void;
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
  isShorts = false,
  topicImageUrl,
  isPlayingDecisionVideo = false,
  decisionVideoUrl,
  onDecisionVideoEnded,
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
  // FIX: If host is active, ALL participants are inactive and should be shown in rail
  const inactiveParticipants = isHostActive
    ? participants
    : participants.filter((p) => p.id !== currentActiveParticipantId);

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
      <div className="broadcast-stage overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Decision Video Player - Shows after participant speech */}
          {isPlayingDecisionVideo && decisionVideoUrl ? (
            <motion.div
              key="decision-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full flex flex-col overflow-hidden"
              style={{ maxHeight: "100%" }}
            >
              {/* Decision Video - Same size as topic image (45% of height) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center p-2 relative overflow-hidden"
                style={{ flex: "0 0 45%" }}
              >
                <video
                  src={decisionVideoUrl}
                  autoPlay
                  onEnded={onDecisionVideoEnded}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                  ref={(el) => { if (el) el.playbackRate = 1.5; }}
                />
              </motion.div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-8 flex-shrink-0" />

              {/* Bottom Section - Empty/Dark (55% of height) */}
              <div
                className="flex items-center justify-center"
                style={{ flex: "0 0 55%" }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <span className="text-lg font-medium text-white/60">Decision Revealed...</span>
                </motion.div>
              </div>
            </motion.div>
          ) : activeSpeaker?.data ? (
            // Check if we should show split layout (Shorts mode with topic image from a Question Group)
            // Host turns OUTSIDE groups won't have topicImageUrl, so they show full screen
            // Host turns INSIDE groups will have topicImageUrl, so they show split layout
            isShorts && topicImageUrl ? (
              // ===== SHORTS SPLIT LAYOUT =====
              <motion.div
                key={`shorts-${activeSpeaker.data.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full flex flex-col overflow-hidden"
                style={{ maxHeight: "100%" }}
              >
                {/* Top Section - Topic Image (45% of height) */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="flex items-center justify-center p-2 relative overflow-hidden"
                  style={{ flex: "0 0 45%" }}
                >
                  {/* Background glow for image */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
                    }}
                  />
                  <motion.img
                    src={topicImageUrl}
                    alt="Topic"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10"
                    style={{ maxHeight: "90%" }}
                    animate={{
                      scale: isPlaying ? [1, 1.01, 1] : 1,
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-8 flex-shrink-0" />

                {/* Bottom Section - Speaker (55% of height) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex flex-col items-center justify-center p-2 overflow-hidden"
                  style={{ flex: "0 0 55%" }}
                >
                  {/* Compact visualizer for Shorts */}
                  <div className="relative" style={{ width: 180, height: 180 }}>
                    {/* Ambient glow */}
                    <motion.div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: 400,
                        height: 400,
                        top: -110,
                        left: -110,
                        background: "radial-gradient(circle, rgba(12, 242, 93, 0.25) 0%, transparent 70%)",
                        zIndex: -1,
                      }}
                      animate={{
                        opacity: isPlaying ? [0.15, 0.3, 0.15] : 0.1,
                        scale: isPlaying ? [1, 1.15, 1] : 1,
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Circular Visualizer */}
                    <CircularVisualizer
                      analyserNode={analyserNode}
                      isActive={isPlaying}
                      size={180}
                      color="mint"
                    />

                    {/* Avatar in center */}
                    <div
                      className="absolute rounded-full overflow-hidden border-2 border-primary/30"
                      style={{
                        width: 120,
                        height: 120,
                        top: 30,
                        left: 30,
                      }}
                    >
                      {activeSpeaker.data.avatarUrl ? (
                        <motion.img
                          src={activeSpeaker.data.avatarUrl}
                          alt={activeSpeaker.data.name}
                          className="w-full h-full object-cover"
                          animate={{
                            scale: isPlaying ? [1, 1.03, 1] : 1,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-brand-teal/30 flex items-center justify-center">
                          <span className="text-3xl font-bold text-white/80">
                            {activeSpeaker.data.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pulsing ring */}
                    {isPlaying && (
                      <motion.div
                        className="absolute rounded-full border-2 border-primary/30 pointer-events-none"
                        style={{
                          width: 140,
                          height: 140,
                          top: 20,
                          left: 20,
                        }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </div>

                  {/* Speaker name */}
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 text-xl font-bold neon-text-mint"
                  >
                    {activeSpeaker.data.name || "Unknown Speaker"}
                  </motion.h2>
                </motion.div>
              </motion.div>
            ) : (
              // ===== STANDARD LAYOUT =====
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
                      // FIX: Consistent color for host and participants
                      background: "radial-gradient(circle, rgba(12, 242, 93, 0.3) 0%, transparent 70%)",
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
                        // FIX: Consistent color "mint"
                        color="mint"
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
                              // FIX: Consistent gradient
                              "bg-gradient-to-br from-primary/30 to-brand-teal/30",
                            )}
                          >
                            <span className="text-6xl font-bold text-white/80">
                              {activeSpeaker.data.name
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </span>
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
                            // FIX: Consistent border
                            "border-primary/30",
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
                  {/* FIX: Removed Host badge for consistency */}
                  <h2
                    className={cn(
                      "text-3xl md:text-4xl font-bold",
                      // FIX: Consistent text color
                      "neon-text-mint",
                    )}
                  >
                    {activeSpeaker.data.name || "Unknown Speaker"}
                  </h2>
                </motion.div>
              </motion.div>
            )
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

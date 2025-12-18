import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Youtube, MessageSquare, ThumbsUp, Bell, Sparkles } from "lucide-react";
import { Participant, Host } from "@/types/debate";
import { Button } from "@/components/ui/Button";

interface OutroSequenceProps {
  title: string;
  participants: Participant[];
  host: Host;
  participantTurns: number;
  onReplay: () => void;
  onBackToSetup: () => void;
  outroMusicUrl?: string;
  outroMusicVolume?: number;
  outroVideoUrl?: string;
}

export function OutroSequence({
  title,
  participants,
  participantTurns,
  onReplay,
  onBackToSetup,
  outroVideoUrl,
}: OutroSequenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoFading, setVideoFading] = useState(false);

  // Auto-play the outro video and handle end
  useEffect(() => {
    const video = videoRef.current;
    if (video && outroVideoUrl) {
      // Reset states when video changes
      setVideoEnded(false);
      setVideoFading(false);
      video.volume = 1;

      video.play().catch(() => {
        // Autoplay failed, user interaction needed
      });

      const fadeDuration = 2; // seconds before end to start fading
      let fadingStarted = false;

      // Handle video timeupdate for fade effect near end
      const handleTimeUpdate = () => {
        const duration = video.duration;
        const currentTime = video.currentTime;
        const timeRemaining = duration - currentTime;

        // Only process when we have valid duration
        if (!isNaN(duration) && isFinite(duration) && duration > fadeDuration) {
          if (timeRemaining <= fadeDuration) {
            // Start fading (only set state once)
            if (!fadingStarted) {
              fadingStarted = true;
              setVideoFading(true);
            }
            // Progressive volume fade (1.0 to 0.0 over fadeDuration)
            const volumeProgress = timeRemaining / fadeDuration;
            video.volume = Math.max(0, Math.min(1, volumeProgress));
          }
        }
      };

      // Handle video ended
      const handleEnded = () => {
        video.volume = 0;
        setVideoEnded(true);
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", handleEnded);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, [outroVideoUrl]);

  // Control video opacity when fading
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.opacity = videoFading || videoEnded ? '0' : '1';
    }
  }, [videoFading, videoEnded]);

  // Memoize content section to prevent re-render when video states change
  const contentSection = useMemo(() => (
    <>
      {/* Trophy icon only shown when no video */}
      {!outroVideoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-6"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block p-6 bg-gradient-to-br from-primary/20 to-brand-teal/20 rounded-full"
          >
            <Trophy className="w-16 h-16 text-primary" />
          </motion.div>
        </motion.div>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-5xl font-bold gradient-brand-text mb-4"
      >
        Debate Complete!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xl text-slate-400 mb-8"
      >
        {title || "The Debate"} - {participantTurns} speaking turns
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-6"
      >
        <h3 className="text-lg text-slate-400 mb-4">Thank you to our participants</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full border-2 border-primary/50 overflow-hidden mb-2 bg-gradient-to-br from-primary/20 to-brand-teal/20">
                {participant.avatarUrl ? (
                  <img
                    src={participant.avatarUrl}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white/80">
                      {participant.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-base text-white font-medium">
                {participant.name || "Participant"}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Who Won Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass-panel p-5 mb-5"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <MessageSquare className="w-7 h-7 text-primary" />
          <span className="text-2xl font-semibold text-white">
            Who Won?
          </span>
        </div>
        <p className="text-lg text-slate-400 mb-4">
          Drop a comment and let us know which side made the stronger case!
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-lg transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-brand-teal/20">
                {participant.avatarUrl ? (
                  <img
                    src={participant.avatarUrl}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white/80">
                      {participant.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-lg text-white">{participant.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="glass-panel p-5 mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Youtube className="w-7 h-7 text-red-500" />
          <span className="text-xl font-semibold text-white">
            Enjoyed this debate?
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-lg">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
            <ThumbsUp className="w-5 h-5 text-primary" />
            <span className="text-slate-300">Like</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
            <Bell className="w-5 h-5 text-primary" />
            <span className="text-slate-300">Subscribe</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-slate-300">Comment</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="flex items-center justify-center gap-3"
      >
        <Button variant="secondary" onClick={onReplay}>
          Replay Debate
        </Button>
        <Button onClick={onBackToSetup}>Back to Setup</Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="mt-6 flex items-center justify-center gap-2 text-slate-500"
      >
        <Sparkles className="w-3 h-3 text-brand-sea" />
        <span className="text-xs">Powered by Weird Science</span>
        <Sparkles className="w-3 h-3 text-brand-sea" />
      </motion.div>
    </>
  ), [title, participantTurns, participants, outroVideoUrl, onReplay, onBackToSetup]);

  // Video section - memoized to prevent video remounting
  // Note: we keep video states out of deps so the video element isn't recreated
  const videoSection = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="relative flex items-center justify-center"
    >
      <div className="relative">
        <div className="w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-4 border-primary/50 shadow-2xl shadow-primary/30 bg-gradient-to-br from-primary/20 to-brand-teal/20 relative">
          {/* Video layer - use regular video, not motion.video to prevent remounting */}
          <video
            ref={videoRef}
            src={outroVideoUrl}
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms]"
            style={{ opacity: 1 }}
          />
        </div>
        {/* Animated ring around video */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Second animated ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-brand-sea/20"
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>
    </motion.div>
  ), [outroVideoUrl]);

  // Trophy overlay - separate from video to control independently
  const trophyOverlay = (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: videoFading || videoEnded ? 1 : 0,
        scale: videoFading || videoEnded ? 1 : 0.5
      }}
      transition={{ duration: 1.5, type: "spring" }}
      className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer z-10"
      style={{ pointerEvents: videoFading || videoEnded ? 'auto' : 'none' }}
      onClick={() => {
        // Reset states to replay video
        setVideoEnded(false);
        setVideoFading(false);
        if (videoRef.current) {
          videoRef.current.volume = 1;
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => { });
        }
      }}
      title="Click to replay video"
    >
      <motion.div
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Trophy className="w-32 h-32 md:w-40 md:h-40 text-primary drop-shadow-lg" />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-transparent to-brand-dark/30" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(12, 242, 93, 0.15) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      {outroVideoUrl ? (
        // Two-column layout when video exists
        <div className="relative z-10 flex items-center justify-center gap-12 px-8 max-w-7xl w-full">
          {/* Left column: Content */}
          <div className="flex-1 text-center max-w-md">
            {contentSection}
          </div>

          {/* Right column: Video with trophy overlay */}
          <div className="flex-1 flex items-center justify-center relative">
            {videoSection}
            {trophyOverlay}
          </div>
        </div>
      ) : (
        // Single column layout when no video
        <div className="relative z-10 text-center px-8 max-w-2xl">
          {contentSection}
        </div>
      )}
    </div>
  );
}

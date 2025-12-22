import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Youtube, MessageSquare, ThumbsUp, Bell, Sparkles } from "lucide-react";
import { Participant, Host, IntroOutroConfig } from "@/types/debate";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
  outroConfig?: IntroOutroConfig;
  isShorts?: boolean;
}

export function OutroSequence({
  participants,
  onReplay,
  onBackToSetup,
  outroVideoUrl,
  outroConfig,
  isShorts = false,
}: OutroSequenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoFading, setVideoFading] = useState(false);

  // Auto-play the outro video and handle end
  useEffect(() => {
    const video = videoRef.current;
    if (video && outroVideoUrl) {
      setVideoEnded(false);
      setVideoFading(false);
      video.volume = 1;

      video.play().catch(() => { });

      const fadeDuration = 2;
      let fadingStarted = false;

      const handleTimeUpdate = () => {
        const duration = video.duration;
        const currentTime = video.currentTime;
        const timeRemaining = duration - currentTime;

        if (!isNaN(duration) && isFinite(duration) && duration > fadeDuration) {
          if (timeRemaining <= fadeDuration) {
            if (!fadingStarted) {
              fadingStarted = true;
              setVideoFading(true);
            }
            const volumeProgress = timeRemaining / fadeDuration;
            video.volume = Math.max(0, Math.min(1, volumeProgress));
          }
        }
      };

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.opacity = videoFading || videoEnded ? '0' : '1';
    }
  }, [videoFading, videoEnded]);

  const participantSizeClasses = useMemo(() => {
    const count = participants.length;
    if (isShorts) {
      if (count > 8) return "w-12 h-12";
      if (count > 5) return "w-16 h-16";
      return "w-20 h-20";
    }
    if (count > 10) return "w-16 h-16";
    if (count > 6) return "w-20 h-20";
    return "w-24 h-24";
  }, [participants.length, isShorts]);

  const contentSection = useMemo(() => (
    <div className={cn(
      "flex flex-col items-center",
      isShorts ? "w-full max-w-[480px] px-2" : "w-full max-w-4xl px-12"
    )}>
      {!outroVideoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-6 flex items-center justify-center text-center"
        >
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0 -z-10 blur-3xl"
              style={{
                background: "radial-gradient(ellipse, rgba(65, 242, 143, 0.4) 0%, transparent 70%)",
                transform: "scale(1.5)",
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.img
              src="/LOGO.svg"
              alt="Weird Science"
              className={cn(
                "h-auto drop-shadow-2xl mx-auto",
                isShorts ? "w-[140px]" : "w-[180px] md:w-[220px]"
              )}
              style={{ filter: "drop-shadow(0 0 20px rgba(65, 242, 143, 0.3))" }}
            />
          </motion.div>
        </motion.div>
      )}

      {outroConfig?.outroHeadline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={cn("text-center w-full", isShorts ? "mb-6" : "mb-10")}
        >
          <h2 className={cn(
            "font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-white leading-tight",
            isShorts ? "text-3xl" : "text-5xl md:text-6xl"
          )}>
            {outroConfig.outroHeadline}
          </h2>
        </motion.div>
      )}

      {(outroConfig?.showParticipants ?? true) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={cn("w-full z-10", isShorts ? "mb-6 px-2" : "mb-8")}
        >
          <h3 className={cn("text-slate-400 mb-4 text-center font-bold tracking-wider uppercase opacity-80", isShorts ? "text-[10px]" : "text-lg")}>
            {outroConfig?.participantAckText || "Thank you to our participants"}
          </h3>
          <div className={cn("flex flex-wrap justify-center", isShorts ? "gap-2" : "gap-3")}>
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className={cn(
                  "flex flex-col items-center",
                  isShorts ? "w-[75px]" : "w-[120px]"
                )}
              >
                <div className={cn(
                  "rounded-full border-2 border-primary/50 overflow-hidden mb-1 bg-gradient-to-br from-primary/20 to-brand-teal/20 shrink-0",
                  participantSizeClasses
                )}>
                  {participant.avatarUrl ? (
                    <img src={participant.avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={cn("font-bold text-white/80", isShorts ? "text-xs" : "text-xl")}>
                        {participant.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <span className={cn("text-white font-bold truncate w-full text-center mt-2", isShorts ? "text-[10px]" : "text-base")}>
                  {participant.name || "Participant"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {(outroConfig?.showWhoWonCTA ?? true) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={cn("glass-panel w-full", isShorts ? "p-3 mb-3" : "p-5 mb-5")}
        >
          <div className="flex items-center justify-center gap-3 mb-3 text-center">
            <MessageSquare className={cn("text-primary", isShorts ? "w-5 h-5" : "w-8 h-8")} />
            <span className={cn("font-black text-white leading-none", isShorts ? "text-2xl" : "text-3xl")}>
              {outroConfig?.ctaHeadline || "Who Won?"}
            </span>
          </div>
          <p className={cn("text-slate-200 text-center mb-6 font-semibold", isShorts ? "text-base leading-snug px-4" : "text-xl")}>
            {outroConfig?.ctaSubtext || "Drop a comment and let us know which side made the stronger case!"}
          </p>
        </motion.div>
      )}

      {(outroConfig?.showEngagementCTA ?? true) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className={cn("glass-panel w-full", isShorts ? "p-5 mb-8" : "p-8 mb-12")}
        >
          <div className="flex flex-col items-center justify-center gap-2 mb-5">
            <div className="flex items-center gap-3">
              <Youtube className={cn("text-red-500", isShorts ? "w-6 h-6" : "w-10 h-10")} />
              <span className={cn("font-black text-white text-center", isShorts ? "text-xl" : "text-3xl")}>
                Enjoyed this debate?
              </span>
            </div>
            {outroConfig?.socialHandle && (
              <span className={cn("text-brand-sea font-bold", isShorts ? "text-lg" : "text-2xl")}>@{outroConfig.socialHandle}</span>
            )}
          </div>
          <div className={cn("flex flex-wrap justify-center", isShorts ? "gap-3" : "gap-5")}>
            {[
              { icon: ThumbsUp, label: "Like", color: "rgba(12, 242, 93, 0.5)", iconColor: "text-primary" },
              { icon: Bell, label: "Subscribe", color: "rgba(239, 68, 68, 0.5)", iconColor: "text-red-500" },
              { icon: MessageSquare, label: "Comment", color: "rgba(12, 242, 93, 0.5)", iconColor: "text-primary" }
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 bg-white/10 rounded-xl border border-white/10 whitespace-nowrap shadow-xl",
                  isShorts ? "px-4 py-2" : "px-7 py-4"
                )}
                animate={{
                  scale: [1, 1.05, 1],
                  borderColor: ["rgba(255, 255, 255, 0.1)", item.color, "rgba(255, 255, 255, 0.1)"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 1.5 + idx * 0.5,
                  ease: "easeInOut",
                }}
              >
                <item.icon className={cn(item.iconColor, isShorts ? "w-5 h-5" : "w-8 h-8")} />
                <span className={cn("text-white font-bold", isShorts ? "text-base" : "text-xl")}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {(outroConfig?.showPoweredBy ?? true) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className={cn("flex items-center justify-center gap-2 text-slate-500", isShorts ? "mt-2" : "mt-6")}
        >
          <Sparkles className="w-3 h-3 text-brand-sea" />
          <span className="text-[10px] md:text-xs">Powered by Weird Science</span>
          <Sparkles className="w-3 h-3 text-brand-sea" />
        </motion.div>
      )}
    </div>
  ), [isShorts, participants, outroVideoUrl, outroConfig, participantSizeClasses]);

  const videoSection = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="relative flex items-center justify-center"
    >
      <div className="relative">
        <div className={cn(
          "rounded-full overflow-hidden border-4 border-primary/50 shadow-2xl shadow-primary/30 bg-gradient-to-br from-primary/20 to-brand-teal/20 relative shrink-0",
          isShorts ? "w-72 h-72" : "w-96 h-96 md:w-[480px] md:h-[480px]"
        )}>
          <video
            ref={videoRef}
            src={outroVideoUrl}
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms]"
            style={{ opacity: 1 }}
          />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  ), [outroVideoUrl, isShorts]);

  const logoOverlay = (
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
        setVideoEnded(false);
        setVideoFading(false);
        if (videoRef.current) {
          videoRef.current.volume = 1;
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => { });
        }
      }}
    >
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.img
          src="/LOGO.svg"
          alt="Weird Science"
          className={cn(
            "h-auto drop-shadow-2xl",
            isShorts ? "w-[160px]" : "w-[200px] md:w-[280px]"
          )}
          style={{ filter: "drop-shadow(0 0 30px rgba(65, 242, 143, 0.3))" }}
        />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-transparent to-brand-dark/30" />
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 0.5, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      <div className={cn(
        "relative z-10 w-full flex items-center justify-center gap-6 px-4 py-8",
        isShorts ? "flex-col max-h-full overflow-y-auto" : "flex-row max-w-7xl gap-12 px-8"
      )}>
        {!isShorts && outroVideoUrl && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center">
              {contentSection}
            </div>
            <div className="flex-1 flex items-center justify-center relative">
              {videoSection}
              {logoOverlay}
            </div>
          </>
        )}

        {isShorts && (
          <div className="flex flex-col items-center gap-6 w-full py-4">
            {outroVideoUrl && (
              <div className="relative shrink-0">
                {videoSection}
                {logoOverlay}
              </div>
            )}
            {contentSection}
          </div>
        )}

        {!outroVideoUrl && !isShorts && (
          <div className="max-w-2xl w-full">
            {contentSection}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 group">
        <div className="h-16" />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 p-4 bg-slate-950/90 backdrop-blur-sm border-t border-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button variant="secondary" onClick={onReplay} className={isShorts ? "px-3 py-1 text-xs" : ""}>
            Replay Debate
          </Button>
          <Button onClick={onBackToSetup} className={isShorts ? "px-3 py-1 text-xs" : ""}>Back to Setup</Button>
        </div>
      </div>
    </div>
  );
}

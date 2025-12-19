import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward } from "lucide-react";
import { Participant, Host, DebateTurn } from "@/types/debate";

interface IntroSequenceProps {
  title: string;
  participants: Participant[];
  host: Host;
  turns: DebateTurn[];
  onComplete: () => void;
  introMusicUrl?: string;
  introMusicVolume?: number;
}

// Floating particle component for visual effect
function FloatingParticle({ delay, duration, size, x, y }: { delay: number; duration: number; size: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/40"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1, 0.5],
        y: [-20, -60],
        x: [0, (Math.random() - 0.5) * 40],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export function IntroSequence({
  title,
  participants,
  onComplete,
}: IntroSequenceProps) {
  const [phase, setPhase] = useState<"branding" | "title" | "participants">("branding");
  const [showSkip, setShowSkip] = useState(false);
  const [currentParticipantIndex, setCurrentParticipantIndex] = useState(-1);

  const baseDelay = 2500; // Extended for logo reveal
  const participantDelay = 1200; // Time between each participant reveal

  const totalDuration =
    baseDelay * 2 +
    participants.length * participantDelay +
    2500; // Extra time for VS showdown

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    const brandingTimer = setTimeout(() => setPhase("title"), baseDelay);
    return () => clearTimeout(brandingTimer);
  }, []);

  useEffect(() => {
    if (phase === "title") {
      const timer = setTimeout(() => {
        setPhase("participants");
        setCurrentParticipantIndex(0);
      }, baseDelay);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "participants" && currentParticipantIndex >= 0) {
      if (currentParticipantIndex < participants.length) {
        const timer = setTimeout(() => {
          setCurrentParticipantIndex((prev) => prev + 1);
        }, participantDelay);
        return () => clearTimeout(timer);
      } else {
        // Extra time to let the VS showdown breathe before completing
        const timer = setTimeout(() => onComplete(), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, currentParticipantIndex, participants.length, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);



  // Generate particles for visual effect
  const particles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 0.2,
    duration: 2 + Math.random() * 1.5,
    size: 4 + Math.random() * 8,
    x: 20 + Math.random() * 60,
    y: 40 + Math.random() * 30,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Animated background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-transparent to-brand-dark/30" />

        {/* Primary glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(2, 115, 94, 0.25) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary glow - offset */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(65, 242, 143, 0.15) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        {/* Particles during branding phase */}
        {phase === "branding" && particles.map((p, i) => (
          <FloatingParticle key={i} {...p} />
        ))}
      </div>

      <div className="relative z-10 text-center px-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {phase === "branding" && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.15, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Logo container with glow effect */}
              <motion.div
                className="relative mb-6"
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Glow backdrop behind logo */}
                <motion.div
                  className="absolute inset-0 -z-10 blur-3xl"
                  style={{
                    background: "radial-gradient(ellipse, rgba(65, 242, 143, 0.4) 0%, transparent 70%)",
                    transform: "scale(1.5)",
                  }}
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* The actual logo */}
                <motion.img
                  src="/LOGO.svg"
                  alt="Weird Science"
                  className="w-[400px] md:w-[500px] h-auto drop-shadow-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  style={{
                    filter: "drop-shadow(0 0 30px rgba(65, 242, 143, 0.3))",
                  }}
                />
              </motion.div>

              {/* "presents" text with cinematic reveal */}
              <motion.p
                className="text-2xl md:text-3xl text-slate-300 font-light tracking-widest uppercase"
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, letterSpacing: "0.3em" }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              >
                presents
              </motion.p>

              {/* Animated line under "presents" */}
              <motion.div
                className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mt-4"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "200px", opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              />
            </motion.div>
          )}

          {phase === "title" && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold gradient-brand-text mb-6">
                {title || "The Debate"}
              </h1>
              <motion.div
                className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </motion.div>
          )}

          {phase === "participants" && (
            <motion.div
              key="participants"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.h3
                className="text-2xl text-slate-400 mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Featuring
              </motion.h3>
              <div className="flex items-center justify-center gap-6 md:gap-10">
                {/* First participant - slides from left */}
                {participants[0] && (
                  <motion.div
                    initial={{ opacity: 0, x: -200, scale: 0.5 }}
                    animate={{
                      opacity: currentParticipantIndex >= 0 ? 1 : 0,
                      x: currentParticipantIndex >= 0 ? 0 : -200,
                      scale: currentParticipantIndex >= 0 ? 1 : 0.5,
                    }}
                    transition={{
                      duration: 0.6,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-3 border-primary/50 overflow-hidden mb-4 bg-gradient-to-br from-primary/20 to-brand-teal/20 relative"
                      animate={currentParticipantIndex >= 0 ? {
                        boxShadow: [
                          "0 0 0px rgba(12, 242, 93, 0)",
                          "0 0 30px rgba(12, 242, 93, 0.5)",
                          "0 0 15px rgba(12, 242, 93, 0.3)",
                        ],
                      } : {}}
                      transition={{ duration: 1, delay: 0.3 }}
                    >
                      {participants[0].avatarUrl ? (
                        <img
                          src={participants[0].avatarUrl}
                          alt={participants[0].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-white/80">
                            {participants[0].name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </motion.div>
                    <motion.span
                      className="text-xl md:text-2xl text-white font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: currentParticipantIndex >= 0 ? 1 : 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {participants[0].name || "Participant"}
                    </motion.span>
                  </motion.div>
                )}

                {/* VS Image - slams into center */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 3, rotate: -15 }}
                  animate={{
                    opacity: currentParticipantIndex >= 1 ? 1 : 0,
                    scale: currentParticipantIndex >= 1 ? 1 : 3,
                    rotate: currentParticipantIndex >= 1 ? 0 : -15,
                  }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  {/* Glow backdrop - green */}
                  <motion.div
                    className="absolute inset-0 -z-10 blur-2xl"
                    style={{
                      background: "radial-gradient(ellipse, rgba(12, 242, 93, 0.6) 0%, transparent 70%)",
                      transform: "scale(2)",
                    }}
                    animate={currentParticipantIndex >= 1 ? {
                      opacity: [0, 1, 0.5],
                      scale: [1.5, 2.5, 2],
                    } : { opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                  {/* Impact flash */}
                  <motion.div
                    className="absolute inset-0 -z-5 rounded-full bg-white"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={currentParticipantIndex >= 1 ? {
                      opacity: [0, 0.8, 0],
                      scale: [0.5, 3, 4],
                    } : {}}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.img
                    src="/VERSUS.png"
                    alt="VS"
                    className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-2xl"
                    style={{
                      filter: "brightness(0) saturate(100%) invert(78%) sepia(85%) saturate(500%) hue-rotate(85deg) brightness(105%) contrast(105%) drop-shadow(0 0 25px rgba(12, 242, 93, 0.8))",
                    }}
                    animate={currentParticipantIndex >= 1 ? {
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />
                </motion.div>

                {/* Second participant - slides from right */}
                {participants[1] && (
                  <motion.div
                    initial={{ opacity: 0, x: 200, scale: 0.5 }}
                    animate={{
                      opacity: currentParticipantIndex >= 1 ? 1 : 0,
                      x: currentParticipantIndex >= 1 ? 0 : 200,
                      scale: currentParticipantIndex >= 1 ? 1 : 0.5,
                    }}
                    transition={{
                      duration: 0.6,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: 0.1
                    }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-3 border-primary/50 overflow-hidden mb-4 bg-gradient-to-br from-primary/20 to-brand-teal/20 relative"
                      animate={currentParticipantIndex >= 1 ? {
                        boxShadow: [
                          "0 0 0px rgba(12, 242, 93, 0)",
                          "0 0 30px rgba(12, 242, 93, 0.5)",
                          "0 0 15px rgba(12, 242, 93, 0.3)",
                        ],
                      } : {}}
                      transition={{ duration: 1, delay: 0.4 }}
                    >
                      {participants[1].avatarUrl ? (
                        <img
                          src={participants[1].avatarUrl}
                          alt={participants[1].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-white/80">
                            {participants[1].name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </motion.div>
                    <motion.span
                      className="text-xl md:text-2xl text-white font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: currentParticipantIndex >= 1 ? 1 : 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {participants[1].name || "Participant"}
                    </motion.span>
                  </motion.div>
                )}
              </div>

              {/* Additional participants (if more than 2) */}
              {participants.length > 2 && (
                <motion.div
                  className="flex flex-wrap justify-center gap-6 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentParticipantIndex >= 2 ? 1 : 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {participants.slice(2).map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{
                        opacity: currentParticipantIndex >= index + 2 ? 1 : 0,
                        y: currentParticipantIndex >= index + 2 ? 0 : 30,
                        scale: currentParticipantIndex >= index + 2 ? 1 : 0.8,
                      }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-24 h-24 rounded-full border-2 border-primary/50 overflow-hidden mb-3 bg-gradient-to-br from-primary/20 to-brand-teal/20">
                        {participant.avatarUrl ? (
                          <img
                            src={participant.avatarUrl}
                            alt={participant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-white/80">
                              {participant.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-lg text-white font-medium">
                        {participant.name || "Participant"}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}


        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSkip && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={handleSkip}
            className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
          >
            <span>Skip Intro</span>
            <SkipForward className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-8">
        <div className="h-1 w-48 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-sea to-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: totalDuration / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}

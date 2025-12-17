import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, SkipForward } from "lucide-react";
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

export function IntroSequence({
  title,
  participants,
  turns,
  onComplete,
}: IntroSequenceProps) {
  const [phase, setPhase] = useState<"branding" | "title" | "participants" | "topics">("branding");
  const [showSkip, setShowSkip] = useState(false);
  const [currentParticipantIndex, setCurrentParticipantIndex] = useState(-1);

  const baseDelay = 1500;
  const participantDelay = 800;
  const topicDelay = 600;

  const totalDuration =
    baseDelay * 2 +
    participants.length * participantDelay +
    Math.min(turns.length, 5) * topicDelay +
    2000;

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
        const timer = setTimeout(() => setPhase("topics"), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, currentParticipantIndex, participants.length]);

  useEffect(() => {
    if (phase === "topics") {
      const topicsToShow = Math.min(turns.length, 5);
      const timer = setTimeout(() => {
        onComplete();
      }, topicsToShow * topicDelay + 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, turns.length, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const topicTitles = turns
    .filter((t) => t.title)
    .map((t) => t.title)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-transparent to-brand-dark/30" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(2, 115, 94, 0.2) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 text-center px-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {phase === "branding" && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                className="mb-8"
              >
                <Sparkles className="w-24 h-24 text-primary" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-sea">
                Weird Science
              </h2>
              <p className="text-xl text-slate-400 mt-3">presents</p>
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
              <h3 className="text-2xl text-slate-400 mb-10">Featuring</h3>
              <div className="flex flex-wrap justify-center gap-10">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -50, scale: 0.8 }}
                    animate={{
                      opacity: index <= currentParticipantIndex ? 1 : 0,
                      x: index <= currentParticipantIndex ? 0 : -50,
                      scale: index <= currentParticipantIndex ? 1 : 0.8,
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-32 h-32 rounded-full border-3 border-primary/50 overflow-hidden mb-4 bg-gradient-to-br from-primary/20 to-brand-teal/20">
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt={participant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-white/80">
                            {participant.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xl text-white font-medium">
                      {participant.name || "Participant"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "topics" && topicTitles.length > 0 && (
            <motion.div
              key="topics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="text-2xl text-slate-400 mb-8">Topics</h3>
              <div className="space-y-4">
                {topicTitles.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15, duration: 0.4 }}
                    className="px-8 py-4 bg-slate-800/50 border border-white/10 rounded-lg"
                  >
                    <span className="text-lg text-white">{topic}</span>
                  </motion.div>
                ))}
              </div>
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

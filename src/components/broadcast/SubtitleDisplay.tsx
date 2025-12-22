import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubtitleCue } from "@/types/debate";
import { cn } from "@/lib/utils";

interface SubtitleDisplayProps {
  subtitle: SubtitleCue | null;
  isHost: boolean;
  isPlaying: boolean;
}

// Typewriter effect component for participant subtitles
function TypewriterText({
  text,
  speed = 30,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isComplete && text.length > 0) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  // Calculate cursor blink
  const showCursor = !isComplete || (isComplete && displayedText.length > 0);

  return (
    <span className="relative">
      {displayedText}
      {showCursor && (
        <motion.span
          className="inline-block w-0.5 h-[1.2em] bg-primary ml-0.5 align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      )}
    </span>
  );
}

// Host subtitle style - clean, professional, elegant fade
function HostSubtitle({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative"
    >
      {/* Background with gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/20 via-brand-sea/30 to-brand-teal/20 rounded-2xl -z-10" />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl rounded-2xl -z-10" />

      {/* Animated glow effect */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-brand-teal/40 via-brand-sea/60 to-brand-teal/40 rounded-2xl blur-sm -z-20"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="px-10 py-6 text-center">
        {/* Decorative top line */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-brand-teal to-transparent"
          animate={{ width: ["0%", "30%", "30%"] }}
          transition={{ duration: 0.5 }}
        />

        <p className="text-xl md:text-2xl font-medium text-white leading-relaxed tracking-wide">
          {text}
        </p>

        {/* Decorative bottom line */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-brand-teal to-transparent"
          animate={{ width: ["0%", "30%", "30%"] }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-teal/60 rounded-tl" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-teal/60 rounded-tr" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-teal/60 rounded-bl" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-teal/60 rounded-br" />
    </motion.div>
  );
}

// Participant subtitle style - typewriter with tech/machine aesthetic
function ParticipantSubtitle({ text }: { text: string }) {
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Calculate typing speed based on text length (faster for longer text)
  const typingSpeed = useMemo(() => {
    const baseSpeed = 25;
    const textLength = text.length;
    if (textLength > 100) return 15;
    if (textLength > 50) return 20;
    return baseSpeed;
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Tech frame background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg rounded-lg -z-10" />

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none"
        style={{ opacity: 0.03 }}
      >
        <motion.div
          className="absolute inset-x-0 h-8 bg-gradient-to-b from-primary/50 to-transparent"
          animate={{ y: ["-100%", "400%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary rounded-full"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="pl-6 pr-8 py-5">
        {/* Terminal-like header */}
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              opacity: isTypingComplete ? 1 : [1, 0.3, 1],
              scale: isTypingComplete ? 1 : [1, 0.8, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: isTypingComplete ? 0 : Infinity,
            }}
          />
          <span className="text-xs text-primary/70 font-mono uppercase tracking-widest">
            {isTypingComplete ? "Transmitted" : "Transmitting..."}
          </span>
        </div>

        {/* Typewriter text */}
        <p className="text-xl md:text-2xl font-medium text-white leading-relaxed font-sans">
          <TypewriterText
            text={text}
            speed={typingSpeed}
            onComplete={() => setIsTypingComplete(true)}
          />
        </p>
      </div>

      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-lg border border-primary/30 pointer-events-none"
        animate={{
          borderColor: isTypingComplete
            ? "rgba(12, 242, 93, 0.3)"
            : [
              "rgba(12, 242, 93, 0.3)",
              "rgba(12, 242, 93, 0.6)",
              "rgba(12, 242, 93, 0.3)",
            ],
        }}
        transition={{
          duration: 1,
          repeat: isTypingComplete ? 0 : Infinity,
        }}
      />

      {/* Data visualization corners */}
      <svg
        className="absolute top-0 right-0 w-12 h-12 text-primary/40"
        viewBox="0 0 48 48"
      >
        <motion.path
          d="M 48 0 L 48 12 L 36 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-12 h-12 text-primary/40"
        viewBox="0 0 48 48"
      >
        <motion.path
          d="M 0 48 L 0 36 L 12 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
      </svg>
    </motion.div>
  );
}

// Speaking indicator when no subtitle
function SpeakingIndicator({ isHost }: { isHost: boolean }) {
  return (
    <motion.div
      key="speaking-indicator"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-20 flex items-center justify-center"
    >
      <div className="flex items-center gap-3">
        {/* Sound wave visualization */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "w-1 rounded-full",
              isHost ? "bg-brand-sea" : "bg-primary",
            )}
            animate={{
              height: [8, 24, 8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function SubtitleDisplay({
  subtitle,
  isHost,
  isPlaying,
}: SubtitleDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full"
    >
      <AnimatePresence mode="wait">
        {subtitle ? (
          isHost ? (
            <HostSubtitle key={`host-${subtitle.id}`} text={subtitle.text} />
          ) : (
            <ParticipantSubtitle
              key={`participant-${subtitle.id}`}
              text={subtitle.text}
            />
          )
        ) : isPlaying ? (
          <SpeakingIndicator key="indicator" isHost={isHost} />
        ) : (
          <div key="empty" className="h-20" />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

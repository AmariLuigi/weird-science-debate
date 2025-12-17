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
}

export function OutroSequence({
  title,
  participants,
  participantTurns,
  onReplay,
  onBackToSetup,
}: OutroSequenceProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
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

      <div className="relative z-10 text-center px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-8"
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
            className="inline-block p-6 bg-gradient-to-br from-primary/20 to-brand-teal/20 rounded-full mb-4"
          >
            <Trophy className="w-20 h-20 text-primary" />
          </motion.div>
        </motion.div>

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
          className="mb-10"
        >
          <h3 className="text-lg text-slate-500 mb-4">Thank you to our participants</h3>
          <div className="flex flex-wrap justify-center gap-4">
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
                <span className="text-sm text-white font-medium">
                  {participant.name || "Participant"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="glass-panel p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Youtube className="w-6 h-6 text-red-500" />
            <span className="text-lg font-semibold text-white">
              Enjoyed this debate?
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <ThumbsUp className="w-4 h-4 text-primary" />
              <span className="text-slate-300">Like this video</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-slate-300">Subscribe for more</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-slate-300">Leave a comment</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-4"
        >
          <Button variant="secondary" onClick={onReplay}>
            Replay Debate
          </Button>
          <Button onClick={onBackToSetup}>Back to Setup</Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-10 flex items-center justify-center gap-2 text-slate-500"
        >
          <Sparkles className="w-4 h-4 text-brand-sea" />
          <span className="text-sm">Powered by Weird Science</span>
          <Sparkles className="w-4 h-4 text-brand-sea" />
        </motion.div>
      </div>
    </div>
  );
}

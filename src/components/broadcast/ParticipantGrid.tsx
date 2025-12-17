import { motion } from "framer-motion";
import { Participant, Host } from "@/types/debate";
import { ParticipantCardBroadcast } from "./ParticipantCardBroadcast";
import { HostCardBroadcast } from "./HostCardBroadcast";
import { cn } from "@/lib/utils";

interface ParticipantGridProps {
  participants: Participant[];
  host: Host;
  activeParticipantId: string | null;
  isHostActive: boolean;
  analyserNode: AnalyserNode | null;
}

export function ParticipantGrid({
  participants,
  host,
  activeParticipantId,
  isHostActive,
  analyserNode,
}: ParticipantGridProps) {
  const count = participants.length;

  // Determine grid layout based on participant count
  const getGridClass = () => {
    if (count === 1) {
      return "grid-cols-1 max-w-xl mx-auto";
    }
    if (count === 2) {
      return "grid-cols-2 max-w-4xl mx-auto";
    }
    if (count === 3) {
      return "grid-cols-3 max-w-5xl mx-auto";
    }
    if (count === 4) {
      return "grid-cols-2 max-w-4xl mx-auto";
    }
    if (count <= 6) {
      return "grid-cols-3 max-w-5xl mx-auto";
    }
    return "grid-cols-4 max-w-6xl mx-auto";
  };

  return (
    <div className="flex flex-col items-center w-full gap-6 p-8">
      {/* Host at the top center */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center"
      >
        <HostCardBroadcast
          host={host}
          isActive={isHostActive}
          analyserNode={analyserNode}
        />
      </motion.div>

      {/* Participants grid below */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={cn("grid gap-6 w-full", getGridClass())}
      >
        {participants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.2 + index * 0.1,
              ease: "easeOut",
            }}
          >
            <ParticipantCardBroadcast
              participant={participant}
              isActive={participant.id === activeParticipantId}
              analyserNode={analyserNode}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

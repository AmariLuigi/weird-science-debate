import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { ParticipantCard } from "./ParticipantCard";
import { Button } from "@/components/ui/Button";

export function ParticipantsSection() {
  const { state, addParticipant } = useDebate();

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-purple/20 rounded-lg">
            <Users className="w-5 h-5 text-neon-purple" />
          </div>
          <h2 className="text-xl font-semibold text-white">Participants</h2>
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-sm text-slate-300">
            {state.participants.length}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={addParticipant}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Participant
        </Button>
      </div>

      {state.participants.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="p-4 bg-slate-800/50 rounded-full mb-4">
            <Users className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-2">No participants yet</p>
          <p className="text-sm text-slate-500">
            Add participants to start building your debate
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {state.participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <ParticipantCard participant={participant} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

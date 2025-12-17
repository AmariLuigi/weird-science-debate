import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { Header } from "@/components/layout/Header";
import { DebateTitleInput } from "./DebateTitleInput";
import { ParticipantsSection } from "./ParticipantsSection";
import { HostSection } from "./HostSection";
import { ScriptTimeline } from "./ScriptTimeline";
import { Button } from "@/components/ui/Button";

export function ConfigurationView() {
  const { state, setTitle, setViewMode, canStartDebate } = useDebate();

  const handleStartDebate = () => {
    if (canStartDebate) {
      setViewMode("broadcast");
    }
  };

  const getValidationMessage = () => {
    if (state.participants.length === 0) {
      return "Add at least one participant";
    }
    if (state.turns.length === 0) {
      return "Add at least one speaking turn";
    }
    const invalidParticipantTurns = state.turns.filter(
      (t) => !t.isHostTurn && (!t.participantId || !t.audioUrl),
    );
    const invalidHostTurns = state.turns.filter(
      (t) => t.isHostTurn && !t.audioUrl,
    );
    const totalInvalid =
      invalidParticipantTurns.length + invalidHostTurns.length;
    if (totalInvalid > 0) {
      if (invalidHostTurns.length > 0 && invalidParticipantTurns.length > 0) {
        return `${totalInvalid} turn(s) need audio files or speaker selection`;
      } else if (invalidHostTurns.length > 0) {
        return `${invalidHostTurns.length} host speech(es) need audio files`;
      } else {
        return `${invalidParticipantTurns.length} turn(s) need a speaker and audio file`;
      }
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <div className="flex items-center gap-4">
          {validationMessage && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-amber-400"
            >
              {validationMessage}
            </motion.span>
          )}
          <Button
            onClick={handleStartDebate}
            disabled={!canStartDebate}
            className="gap-2"
            size="lg"
          >
            <Play className="w-5 h-5" />
            Start Debate
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </Header>

      <div className="flex-1 px-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Debate Title */}
          <DebateTitleInput value={state.title} onChange={setTitle} />

          {/* Host Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <HostSection />
          </motion.div>

          {/* Participants Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ParticipantsSection />
          </motion.div>

          {/* Script Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ScriptTimeline />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

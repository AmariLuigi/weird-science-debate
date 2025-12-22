import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { Header } from "@/components/layout/Header";
import { DebateTitleInput } from "./DebateTitleInput";
import { ParticipantsSection } from "./ParticipantsSection";
import { HostSection } from "./HostSection";
import { ScriptTimeline } from "./ScriptTimeline";
import { AudioEnhancementsSection } from "./AudioEnhancementsSection";
import { FormatSelector } from "./FormatSelector";
import { Button } from "@/components/ui/Button";

export function ConfigurationView() {
  const { state, setTitle, setViewMode, canStartDebate, setBroadcastPhase } = useDebate();

  const handleStartDebate = () => {
    if (canStartDebate) {
      setBroadcastPhase(state.introOutroConfig.enableIntro ? "intro" : "debate");
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

    // Helper to check if a turn has audio (either legacy audioUrl or audioTracks)
    const hasAudio = (t: typeof state.turns[0]) => {
      if (t.audioUrl) return true;
      if (t.audioTracks && t.audioTracks.some(track => track.audioUrl)) return true;
      // Host turns with video don't need separate audio
      if (t.isHostTurn && t.videoUrl) return true;
      return false;
    };

    const invalidParticipantTurns = state.turns.filter(
      (t) => !t.isHostTurn && (!t.participantId || !hasAudio(t)),
    );
    const invalidHostTurns = state.turns.filter(
      (t) => t.isHostTurn && !hasAudio(t),
    );

    // Debug: log invalid turns
    if (invalidParticipantTurns.length > 0 || invalidHostTurns.length > 0) {
      console.log("[Validation] Invalid turns:", {
        participant: invalidParticipantTurns.map(t => ({ id: t.id, title: t.title, participantId: t.participantId, hasAudioUrl: !!t.audioUrl, audioTracks: t.audioTracks?.length || 0 })),
        host: invalidHostTurns.map(t => ({ id: t.id, title: t.title, hasAudioUrl: !!t.audioUrl, hasVideoUrl: !!t.videoUrl })),
      });
    }

    const totalInvalid =
      invalidParticipantTurns.length + invalidHostTurns.length;
    if (totalInvalid > 0) {
      // Show specific turn name if only one is invalid
      if (totalInvalid === 1) {
        const invalidTurn = invalidParticipantTurns[0] || invalidHostTurns[0];
        const turnName = invalidTurn.title || `Turn #${state.turns.findIndex(t => t.id === invalidTurn.id) + 1}`;
        if (invalidHostTurns.length > 0) {
          return `"${turnName}" needs audio or video`;
        } else {
          return `"${turnName}" needs a speaker and audio file`;
        }
      }

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

          {/* Video Format Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <FormatSelector />
          </motion.div>

          {/* Host Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HostSection />
          </motion.div>

          {/* Participants Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <ParticipantsSection />
          </motion.div>

          {/* Audio Enhancements Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AudioEnhancementsSection />
          </motion.div>

          {/* Script Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <ScriptTimeline />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

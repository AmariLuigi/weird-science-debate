import { Trash2 } from "lucide-react";
import { Participant } from "@/types/debate";
import { useDebate } from "@/context/DebateContext";
import { TextInput } from "@/components/ui/TextInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";

interface ParticipantCardProps {
  participant: Participant;
}

export function ParticipantCard({ participant }: ParticipantCardProps) {
  const { updateParticipant, removeParticipant } = useDebate();

  return (
    <div className="glass-panel-light p-4 flex items-center gap-4">
      {/* Avatar Upload */}
      <div className="relative flex-shrink-0">
        <FileUpload
          type="image"
          accept="image/*"
          value={participant.avatarFile}
          previewUrl={participant.avatarUrl}
          onChange={(file) =>
            updateParticipant(participant.id, { avatarFile: file })
          }
          compact
        />
      </div>

      {/* Name Input */}
      <div className="flex-1 min-w-0">
        <TextInput
          value={participant.name}
          onChange={(e) =>
            updateParticipant(participant.id, { name: e.target.value })
          }
          placeholder="Participant name..."
          className="text-sm"
        />
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeParticipant(participant.id)}
        className="flex-shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

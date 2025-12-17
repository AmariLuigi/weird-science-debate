import { Mic } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { FileUpload } from "@/components/ui/FileUpload";

export function HostSection() {
  const { state, updateHost } = useDebate();

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-neon-purple/20 rounded-lg">
          <Mic className="w-5 h-5 text-neon-purple" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Host</h2>
          <p className="text-sm text-slate-400">Weird Science</p>
        </div>
      </div>

      <div className="flex items-start gap-6">
        {/* Host Avatar Upload */}
        <div className="flex flex-col items-center gap-2">
          <FileUpload
            type="image"
            accept="image/*"
            value={state.host.avatarFile}
            previewUrl={state.host.avatarUrl}
            onChange={(file) => updateHost({ avatarFile: file })}
          />
          <span className="text-xs text-slate-400">Host Avatar</span>
        </div>

        {/* Host Info */}
        <div className="flex-1">
          <div className="glass-panel-light p-4 rounded-lg">
            <p className="text-sm text-slate-300">
              The host{" "}
              <span className="text-neon-purple font-semibold">
                Weird Science
              </span>{" "}
              will appear in the broadcast and can have speaking turns
              throughout the debate.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Add host speeches in the Script Timeline below using the "Add Host
              Speech" button.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { FileText, Clock, ChevronDown, X } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { DEBATE_TEMPLATES, DebateTemplate } from "@/types/debate";
import { formatDuration } from "@/lib/audioDuration";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function TemplateSelector() {
  const { state, setTemplate } = useDebate();
  const [isOpen, setIsOpen] = useState(false);

  const selectedTemplate = state.template;

  const handleSelectTemplate = (template: DebateTemplate | null) => {
    setTemplate(template || undefined);
    setIsOpen(false);
  };

  return (
    <div className="glass-panel p-4 relative z-20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Debate Template</h3>
        </div>
        {selectedTemplate && (
          <button
            onClick={() => handleSelectTemplate(null)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Select a template to get suggested turn types and expected durations for
        each speaking turn.
      </p>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all",
            selectedTemplate
              ? "bg-primary/10 border-primary/30 text-white"
              : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/20",
          )}
        >
          <div className="flex items-center gap-3">
            <FileText
              className={cn(
                "w-5 h-5",
                selectedTemplate ? "text-primary" : "text-slate-500",
              )}
            />
            <div className="text-left">
              <div className="font-medium">
                {selectedTemplate?.name || "No template selected"}
              </div>
              {selectedTemplate && (
                <div className="text-xs text-slate-400">
                  {selectedTemplate.description}
                </div>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-lg shadow-xl overflow-hidden"
          >
            <div
              onClick={() => handleSelectTemplate(null)}
              className={cn(
                "px-4 py-3 cursor-pointer transition-colors",
                !selectedTemplate
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-white/5 text-slate-400",
              )}
            >
              <div className="font-medium">Custom (No Template)</div>
              <div className="text-xs text-slate-500">
                Configure turns manually without time guidelines
              </div>
            </div>

            {DEBATE_TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={cn(
                  "px-4 py-3 cursor-pointer transition-colors border-t border-white/5",
                  selectedTemplate?.id === template.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-white/5 text-white",
                )}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-slate-400 mb-2">
                  {template.description}
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.turnTypes.map((turnType) => (
                    <div
                      key={turnType.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: `${turnType.color}20`,
                        borderColor: `${turnType.color}40`,
                        borderWidth: 1,
                        color: turnType.color,
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{turnType.label}</span>
                      <span className="opacity-70">
                        ({formatDuration(turnType.expectedDuration)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-white/10"
        >
          <div className="text-sm text-slate-400 mb-2">Available turn types:</div>
          <div className="flex flex-wrap gap-2">
            {selectedTemplate.turnTypes.map((turnType) => (
              <div
                key={turnType.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: `${turnType.color}15`,
                  borderColor: `${turnType.color}30`,
                  borderWidth: 1,
                  color: turnType.color,
                }}
              >
                <span className="font-medium">{turnType.label}</span>
                <span className="opacity-70">
                  {formatDuration(turnType.expectedDuration)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

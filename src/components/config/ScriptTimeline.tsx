import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, ListOrdered, Mic, FileText, ChevronDown, Sparkles, ImageIcon } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { FLOW_TEMPLATES } from "@/types/debate";
import { TurnItem } from "./TurnItem";
import { QuestionGroupCard } from "./QuestionGroupCard";
import { Button } from "@/components/ui/Button";

export function ScriptTimeline() {
  const { state, addTurn, addHostTurn, reorderTurns, loadFlowTemplate, addQuestionGroup, addTurnToGroup, getGroupForTurn, reorderQuestionGroups } = useDebate();
  const [showTemplates, setShowTemplates] = useState(false);

  const isShorts = state.videoFormat === "shorts";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if reordering groups (both IDs start with "sortable-group-")
    if (activeId.startsWith("sortable-group-") && overId.startsWith("sortable-group-")) {
      const activeGroupId = activeId.replace("sortable-group-", "");
      const overGroupId = overId.replace("sortable-group-", "");
      reorderQuestionGroups(activeGroupId, overGroupId);
      return;
    }

    // Check if dropping on a group droppable zone
    if (overId.startsWith("group-")) {
      const groupId = overId.replace("group-", "");
      addTurnToGroup(groupId, activeId);
      return;
    }

    // Otherwise, reorder turns
    if (activeId !== overId) {
      reorderTurns(activeId, overId);
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    loadFlowTemplate(templateId);
    setShowTemplates(false);
  };

  // Get turns that are NOT in any group (ungrouped turns)
  const ungroupedTurns = state.turns.filter((turn) => !getGroupForTurn(turn.id));

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <ListOrdered className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white">Script Timeline</h2>
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-sm text-slate-300">
            {state.turns.length} turns
          </span>
          {isShorts && state.questionGroups.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-500/20 rounded-full text-sm text-purple-300">
              {state.questionGroups.length} groups
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Template dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Load Template
              <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </Button>

            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Quick Setup Templates</span>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {FLOW_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleLoadTemplate(template.id)}
                        className="w-full p-3 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{template.name}</span>
                          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {template.steps.length} steps
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{template.description}</p>
                      </button>
                    ))}
                  </div>
                  {state.participants.length < 2 && (
                    <div className="p-3 bg-amber-500/10 border-t border-amber-500/20">
                      <p className="text-xs text-amber-400">
                        💡 Add at least 2 participants before loading a template for best results
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Question Group button - Shorts mode only */}
          {isShorts && (
            <Button
              variant="secondary"
              size="sm"
              onClick={addQuestionGroup}
              className="gap-2 border-purple-500/30 hover:border-purple-500/50"
            >
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300">Add Question</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={addHostTurn}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            Add Host Speech
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={addTurn}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Turn
          </Button>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowTemplates(false)}
        />
      )}

      {state.turns.length === 0 && state.questionGroups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="p-4 bg-slate-800/50 rounded-full mb-4">
            <ListOrdered className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-2">No speaking turns yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Add turns manually or load a template to get started quickly
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTemplates(true)}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Load Template
          </Button>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {/* Question Groups (Shorts mode) */}
            {isShorts && state.questionGroups.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-purple-400 uppercase tracking-wider">
                  <ImageIcon className="w-3 h-3" />
                  <span>Question Groups</span>
                </div>
                <SortableContext
                  items={state.questionGroups.map((g) => `sortable-group-${g.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="popLayout">
                    {state.questionGroups.map((group) => (
                      <QuestionGroupCard
                        key={group.id}
                        group={group}
                        turns={state.turns}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </div>
            )}

            {/* Ungrouped Turns */}
            {ungroupedTurns.length > 0 && (
              <div className="space-y-3">
                {isShorts && state.questionGroups.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider pt-4">
                    <ListOrdered className="w-3 h-3" />
                    <span>Ungrouped Turns</span>
                  </div>
                )}
                <SortableContext
                  items={ungroupedTurns.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {ungroupedTurns.map((turn, index) => (
                        <TurnItem key={turn.id} turn={turn} index={index} />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </div>
            )}
          </div>
        </DndContext>
      )}
    </div>
  );
}


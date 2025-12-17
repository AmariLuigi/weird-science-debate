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
import { Plus, ListOrdered, Mic } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { TurnItem } from "./TurnItem";
import { Button } from "@/components/ui/Button";

export function ScriptTimeline() {
  const { state, addTurn, addHostTurn, reorderTurns } = useDebate();

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

    if (over && active.id !== over.id) {
      reorderTurns(active.id as string, over.id as string);
    }
  };

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
        </div>
        <div className="flex items-center gap-2">
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

      {state.turns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="p-4 bg-slate-800/50 rounded-full mb-4">
            <ListOrdered className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-2">No speaking turns yet</p>
          <p className="text-sm text-slate-500">
            Add turns to create the debate script
          </p>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.turns.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {state.turns.map((turn, index) => (
                  <TurnItem key={turn.id} turn={turn} index={index} />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

import { useState, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    ChevronRight,
    ImageIcon,
    X,
    Trash2,
    Plus,
    GripVertical,
    Video,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuestionGroup, DebateTurn } from "@/types/debate";
import { useDebate } from "@/context/DebateContext";
import { TextInput } from "@/components/ui/TextInput";
import { TurnItem } from "./TurnItem";
import { cn } from "@/lib/utils";

interface QuestionGroupCardProps {
    group: QuestionGroup;
    turns: DebateTurn[];
}

export const QuestionGroupCard = forwardRef<HTMLDivElement, QuestionGroupCardProps>(
    ({ group, turns }, forwardedRef) => {
        const {
            updateQuestionGroup,
            removeQuestionGroup,
            removeTurnFromGroup,
            reorderTurnsInGroup,
            addTurnToQuestionGroup,
        } = useDebate();

        const [isExpanded, setIsExpanded] = useState(true);

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

        // Droppable zone for this group
        const { setNodeRef, isOver } = useDroppable({
            id: `group-${group.id}`,
            data: { type: "group", groupId: group.id },
        });

        const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
                reorderTurnsInGroup(group.id, active.id as string, over.id as string);
            }
        };

        const handleImageChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                    updateQuestionGroup(group.id, { imageFile: file });
                }
            },
            [group.id, updateQuestionGroup],
        );

        const handleRemoveImage = useCallback(() => {
            updateQuestionGroup(group.id, { imageFile: undefined });
        }, [group.id, updateQuestionGroup]);

        const handlePositiveVideoChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                    updateQuestionGroup(group.id, { positiveVideoFile: file });
                }
            },
            [group.id, updateQuestionGroup],
        );

        const handleRemovePositiveVideo = useCallback(() => {
            updateQuestionGroup(group.id, { positiveVideoFile: undefined });
        }, [group.id, updateQuestionGroup]);

        const handleNegativeVideoChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                    updateQuestionGroup(group.id, { negativeVideoFile: file });
                }
            },
            [group.id, updateQuestionGroup],
        );

        const handleRemoveNegativeVideo = useCallback(() => {
            updateQuestionGroup(group.id, { negativeVideoFile: undefined });
        }, [group.id, updateQuestionGroup]);

        // Get turns that belong to this group
        const groupTurns = group.turnIds
            .map((id) => turns.find((t) => t.id === id))
            .filter((t): t is DebateTurn => t !== undefined);

        // Make this component sortable for reordering groups
        const {
            attributes,
            listeners,
            setNodeRef: setSortableNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: `sortable-group-${group.id}` });

        const sortableStyle = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        // Combine refs for the sortable wrapper
        const combinedRef = useCallback(
            (node: HTMLDivElement | null) => {
                setSortableNodeRef(node);
                if (typeof forwardedRef === "function") {
                    forwardedRef(node);
                } else if (forwardedRef) {
                    forwardedRef.current = node;
                }
            },
            [setSortableNodeRef, forwardedRef],
        );

        return (
            <div
                ref={combinedRef}
                style={sortableStyle}
                {...attributes}
            >
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                        "rounded-xl border-2 transition-all duration-300 overflow-hidden",
                        isOver
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-purple-500/30 bg-purple-500/5",
                        isDragging && "shadow-xl ring-2 ring-purple-500",
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 bg-purple-500/10">
                        {/* Drag handle */}
                        <button
                            type="button"
                            {...listeners}
                            className="p-1 hover:bg-white/10 rounded transition-colors cursor-grab active:cursor-grabbing touch-none"
                            title="Drag to reorder"
                        >
                            <GripVertical className="w-5 h-5 text-purple-400" />
                        </button>

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-purple-400" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-purple-400" />
                            )}
                        </button>

                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-purple-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <TextInput
                                value={group.title}
                                onChange={(e) =>
                                    updateQuestionGroup(group.id, { title: e.target.value })
                                }
                                placeholder="Question Group Title..."
                                className="text-sm font-medium bg-transparent border-none"
                            />
                        </div>

                        <span className="px-2 py-0.5 bg-purple-500/20 rounded-full text-xs text-purple-300">
                            {groupTurns.length} turns
                        </span>

                        <button
                            onClick={() => removeQuestionGroup(group.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete group"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 space-y-4">
                                    {/* Image Upload */}
                                    <div className="relative">
                                        {group.imageUrl ? (
                                            <div className="flex items-center gap-4 p-3 bg-slate-800/50 border border-purple-500/30 rounded-lg">
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900">
                                                    <img
                                                        src={group.imageUrl}
                                                        alt="Topic"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white truncate">
                                                        {group.imageFile?.name || "Topic Image"}
                                                    </div>
                                                    <div className="text-xs text-purple-400 mt-1">
                                                        Shown above speakers in this group
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-slate-400 hover:text-white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-3 p-4 bg-slate-800/30 border border-dashed border-purple-500/40 rounded-lg hover:border-purple-500/60 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer">
                                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                                    <ImageIcon className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm text-white">Upload Topic Image</div>
                                                    <div className="text-xs text-slate-400">
                                                        Image displayed above speaker for all turns in this group
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* Decision Videos Section */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Positive Decision Video */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-green-400">
                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                <span>Positive Outcome</span>
                                            </div>
                                            {group.positiveVideoUrl ? (
                                                <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <Video className="w-4 h-4 text-green-400 shrink-0" />
                                                    <span className="text-xs text-white truncate flex-1">
                                                        {group.positiveVideoFile?.name || "Video"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemovePositiveVideo}
                                                        className="p-0.5 hover:bg-white/10 rounded"
                                                    >
                                                        <X className="w-3 h-3 text-slate-400 hover:text-white" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 p-2 bg-slate-800/30 border border-dashed border-green-500/30 rounded-lg hover:border-green-500/50 hover:bg-slate-800/50 transition-all cursor-pointer">
                                                    <Video className="w-4 h-4 text-green-400/60" />
                                                    <span className="text-xs text-slate-400">Upload video</span>
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={handlePositiveVideoChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        {/* Negative Decision Video */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-red-400">
                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                <span>Negative Outcome</span>
                                            </div>
                                            {group.negativeVideoUrl ? (
                                                <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                    <Video className="w-4 h-4 text-red-400 shrink-0" />
                                                    <span className="text-xs text-white truncate flex-1">
                                                        {group.negativeVideoFile?.name || "Video"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveNegativeVideo}
                                                        className="p-0.5 hover:bg-white/10 rounded"
                                                    >
                                                        <X className="w-3 h-3 text-slate-400 hover:text-white" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 p-2 bg-slate-800/30 border border-dashed border-red-500/30 rounded-lg hover:border-red-500/50 hover:bg-slate-800/50 transition-all cursor-pointer">
                                                    <Video className="w-4 h-4 text-red-400/60" />
                                                    <span className="text-xs text-slate-400">Upload video</span>
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={handleNegativeVideoChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        {/* Scoreboard Labels */}
                                        <div className="space-y-1">
                                            <label className="text-xs text-green-400">Scoreboard Label</label>
                                            <input
                                                type="text"
                                                value={group.positiveLabel || ""}
                                                onChange={(e) => updateQuestionGroup(group.id, { positiveLabel: e.target.value })}
                                                placeholder="e.g., Accept, Yes, Agree"
                                                className="w-full px-2 py-1.5 bg-slate-800/50 border border-green-500/30 rounded-lg text-xs text-white placeholder-slate-500 focus:border-green-500/60 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-red-400">Scoreboard Label</label>
                                            <input
                                                type="text"
                                                value={group.negativeLabel || ""}
                                                onChange={(e) => updateQuestionGroup(group.id, { negativeLabel: e.target.value })}
                                                placeholder="e.g., Reject, No, Disagree"
                                                className="w-full px-2 py-1.5 bg-slate-800/50 border border-red-500/30 rounded-lg text-xs text-white placeholder-slate-500 focus:border-red-500/60 focus:outline-none"
                                            />
                                        </div>
                                    </div>


                                    {/* Turns drop zone */}
                                    <div
                                        ref={setNodeRef}
                                        className={cn(
                                            "min-h-[100px] rounded-lg border-2 border-dashed transition-all duration-300",
                                            isOver
                                                ? "border-purple-500 bg-purple-500/10"
                                                : "border-slate-600/50 bg-slate-800/20",
                                            groupTurns.length === 0 && "flex items-center justify-center",
                                        )}
                                    >
                                        {groupTurns.length === 0 ? (
                                            <p className="text-sm text-slate-500 text-center py-4">
                                                Drag turns here to add them to this group
                                            </p>
                                        ) : (
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <SortableContext
                                                    items={group.turnIds}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    <div className="p-3 space-y-3">
                                                        {groupTurns.map((turn, index) => (
                                                            <div key={turn.id} className="relative">
                                                                {/* Remove from group button - positioned at top right */}
                                                                <button
                                                                    onClick={() => removeTurnFromGroup(group.id, turn.id)}
                                                                    className="absolute -top-2 -right-2 z-10 p-1.5 bg-purple-600 hover:bg-red-500 rounded-full shadow-lg transition-colors"
                                                                    title="Remove from group"
                                                                >
                                                                    <X className="w-3 h-3 text-white" />
                                                                </button>
                                                                {/* Full TurnItem for editing */}
                                                                <TurnItem turn={turn} index={index} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </SortableContext>
                                            </DndContext>
                                        )}
                                    </div>

                                    {/* Add Turn to Group Button */}
                                    <button
                                        type="button"
                                        onClick={() => addTurnToQuestionGroup(group.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/10 border border-dashed border-purple-500/40 rounded-lg hover:border-purple-500/60 hover:bg-purple-500/20 transition-all duration-300 text-sm text-purple-300 hover:text-purple-200"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Turn to Group
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        );
    },
);

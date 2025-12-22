import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { QuestionGroup, DebateTurn } from "@/types/debate";
import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface ScoreboardProps {
    questionGroups: QuestionGroup[];
    turns: DebateTurn[];
    currentTurnIndex: number;
    className?: string;
    style?: CSSProperties;
}

export function Scoreboard({ questionGroups, turns, currentTurnIndex, className, style }: ScoreboardProps) {
    // Calculate scores based on decisions made in turns up to current index
    const playedTurns = turns.slice(0, currentTurnIndex + 1);

    // Get first group that has labels defined (for scoreboard display)
    const activeGroup = questionGroups.find(g => g.positiveLabel || g.negativeLabel);

    if (!activeGroup) return null;

    const positiveLabel = activeGroup.positiveLabel || "Positive";
    const negativeLabel = activeGroup.negativeLabel || "Negative";

    // Count decisions
    let positiveCount = 0;
    let negativeCount = 0;

    playedTurns.forEach(turn => {
        if (turn.decision === 'positive') positiveCount++;
        if (turn.decision === 'negative') negativeCount++;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
                "glass-panel px-4 py-3 flex items-center justify-center gap-8",
                className
            )}
            style={style}
        >
            {/* Positive Side */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{positiveLabel}</span>
                </div>
                <motion.div
                    key={positiveCount}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center"
                >
                    <span className="text-xl font-bold text-green-400">{positiveCount}</span>
                </motion.div>
            </div>

            {/* Divider */}
            <div className="text-2xl font-light text-slate-500">vs</div>

            {/* Negative Side */}
            <div className="flex items-center gap-3">
                <motion.div
                    key={negativeCount}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
                >
                    <span className="text-xl font-bold text-red-400">{negativeCount}</span>
                </motion.div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-400">{negativeLabel}</span>
                    <ThumbsDown className="w-5 h-5 text-red-400" />
                </div>
            </div>
        </motion.div>
    );
}

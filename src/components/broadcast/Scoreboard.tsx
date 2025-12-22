import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { QuestionGroup, DebateTurn, Participant } from "@/types/debate";
import { cn } from "@/lib/utils";
import { CSSProperties, useEffect, useState, useRef } from "react";

interface ScoreboardProps {
    questionGroups: QuestionGroup[];
    turns: DebateTurn[];
    participants: Participant[];
    currentTurnIndex: number;
    triggerAnimation?: boolean; // When true, triggers the flying avatar animation
    className?: string;
    style?: CSSProperties;
}

interface FlyingAvatar {
    id: string;
    avatarUrl?: string;
    name: string;
    side: 'positive' | 'negative';
}

export function Scoreboard({ questionGroups, turns, participants, currentTurnIndex, triggerAnimation, className, style }: ScoreboardProps) {
    const [flyingAvatar, setFlyingAvatar] = useState<FlyingAvatar | null>(null);
    const [displayedCounts, setDisplayedCounts] = useState({ positive: 0, negative: 0 });
    const [showCountUpdate, setShowCountUpdate] = useState<'positive' | 'negative' | null>(null);
    const lastTriggerRef = useRef(false);

    // Calculate actual scores based on decisions made in turns up to current index
    const playedTurns = turns.slice(0, currentTurnIndex + 1);

    // Get first group that has labels defined (for scoreboard display)
    const activeGroup = questionGroups.find(g => g.positiveLabel || g.negativeLabel);

    if (!activeGroup) return null;

    const positiveLabel = activeGroup.positiveLabel || "Positive";
    const negativeLabel = activeGroup.negativeLabel || "Negative";

    // Count actual decisions
    let actualPositiveCount = 0;
    let actualNegativeCount = 0;

    playedTurns.forEach(turn => {
        if (turn.decision === 'positive') actualPositiveCount++;
        if (turn.decision === 'negative') actualNegativeCount++;
    });

    // Get current turn's decision and participant
    const currentTurn = turns[currentTurnIndex];
    const currentParticipant = participants.find(p => p.id === currentTurn?.participantId);

    // Trigger animation when triggerAnimation becomes true
    useEffect(() => {
        if (triggerAnimation && !lastTriggerRef.current && currentParticipant && currentTurn?.decision) {
            console.log("[Scoreboard] Animation triggered for decision:", currentTurn.decision);

            // Start flying avatar animation
            setFlyingAvatar({
                id: `${currentTurn.id}-${Date.now()}`,
                avatarUrl: currentParticipant.avatarUrl,
                name: currentParticipant.name,
                side: currentTurn.decision as 'positive' | 'negative',
            });

            // After flying animation (0.8s), update the count with pop animation
            setTimeout(() => {
                setShowCountUpdate(currentTurn.decision as 'positive' | 'negative');
                setDisplayedCounts(prev => ({
                    positive: currentTurn.decision === 'positive' ? prev.positive + 1 : prev.positive,
                    negative: currentTurn.decision === 'negative' ? prev.negative + 1 : prev.negative,
                }));
            }, 800);

            // Clear flying avatar
            setTimeout(() => {
                setFlyingAvatar(null);
            }, 1000);

            // Clear count update highlight
            setTimeout(() => {
                setShowCountUpdate(null);
            }, 1400);
        }

        lastTriggerRef.current = !!triggerAnimation;
    }, [triggerAnimation, currentParticipant, currentTurn]);

    // Initialize displayed counts from actual counts (but lag behind by 1 for animation)
    useEffect(() => {
        // Only initialize if not animating
        if (!triggerAnimation && !flyingAvatar) {
            // Set to actual counts minus current turn's decision (to animate current)
            const currentDecision = currentTurn?.decision;
            setDisplayedCounts({
                positive: currentDecision === 'positive' ? actualPositiveCount - 1 : actualPositiveCount,
                negative: currentDecision === 'negative' ? actualNegativeCount - 1 : actualNegativeCount,
            });
        }
    }, [currentTurnIndex]);

    // Use displayed counts for rendering (allows animation control)
    const positiveCount = Math.max(0, displayedCounts.positive);
    const negativeCount = Math.max(0, displayedCounts.negative);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
                "glass-panel px-6 py-4 flex items-center justify-center gap-8 relative overflow-visible",
                className
            )}
            style={style}
        >
            {/* Flying Avatar Animation */}
            <AnimatePresence>
                {flyingAvatar && (
                    <motion.div
                        key={flyingAvatar.id}
                        initial={{
                            opacity: 1,
                            scale: 1.5,
                            y: 100,
                            x: 0,
                        }}
                        animate={{
                            opacity: [1, 1, 0.8],
                            scale: [1.5, 0.8, 0.3],
                            y: [100, 20, -5],
                            x: flyingAvatar.side === 'positive' ? [0, -40, -80] : [0, 40, 80],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.4, 0, 0.2, 1],
                            times: [0, 0.5, 1],
                        }}
                        className="absolute z-50 pointer-events-none"
                        style={{ bottom: '-80px' }}
                    >
                        <div
                            className={cn(
                                "w-16 h-16 rounded-full overflow-hidden border-3 shadow-lg",
                                flyingAvatar.side === 'positive'
                                    ? "border-green-400 shadow-green-500/50"
                                    : "border-red-400 shadow-red-500/50"
                            )}
                        >
                            {flyingAvatar.avatarUrl ? (
                                <img
                                    src={flyingAvatar.avatarUrl}
                                    alt={flyingAvatar.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-brand-teal/50 flex items-center justify-center">
                                    <span className="text-xl font-bold text-white">
                                        {flyingAvatar.name?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Trailing particles */}
                        <motion.div
                            animate={{ opacity: [1, 0], scale: [0.5, 2] }}
                            transition={{ duration: 0.6, repeat: 1 }}
                            className={cn(
                                "absolute inset-0 rounded-full blur-sm",
                                flyingAvatar.side === 'positive'
                                    ? "bg-green-400/50"
                                    : "bg-red-400/50"
                            )}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Positive Side */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{positiveLabel}</span>
                </div>
                <motion.div
                    animate={showCountUpdate === 'positive' ? {
                        scale: [1, 1.4, 1],
                        rotate: [0, -5, 0],
                    } : {}}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                    }}
                    className="relative w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center"
                >
                    {/* Glow effect on update */}
                    <AnimatePresence>
                        {showCountUpdate === 'positive' && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0.8, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2.5 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="absolute inset-0 rounded-full bg-green-400/60"
                                />
                                <motion.div
                                    initial={{ opacity: 0.6, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="absolute inset-0 rounded-full border-2 border-green-400"
                                />
                                <motion.div
                                    initial={{ opacity: 0.4, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2.2 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="absolute inset-0 rounded-full border border-green-400"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.span
                            key={positiveCount}
                            initial={{ opacity: 0, y: 15, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.5 }}
                            transition={{ duration: 0.3 }}
                            className="text-2xl font-bold text-green-400 relative z-10"
                        >
                            {positiveCount}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Divider */}
            <div className="text-2xl font-light text-slate-500">vs</div>

            {/* Negative Side */}
            <div className="flex items-center gap-3">
                <motion.div
                    animate={showCountUpdate === 'negative' ? {
                        scale: [1, 1.4, 1],
                        rotate: [0, 5, 0],
                    } : {}}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                    }}
                    className="relative w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
                >
                    {/* Glow effect on update */}
                    <AnimatePresence>
                        {showCountUpdate === 'negative' && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0.8, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2.5 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="absolute inset-0 rounded-full bg-red-400/60"
                                />
                                <motion.div
                                    initial={{ opacity: 0.6, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="absolute inset-0 rounded-full border-2 border-red-400"
                                />
                                <motion.div
                                    initial={{ opacity: 0.4, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2.2 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="absolute inset-0 rounded-full border border-red-400"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.span
                            key={negativeCount}
                            initial={{ opacity: 0, y: 15, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.5 }}
                            transition={{ duration: 0.3 }}
                            className="text-2xl font-bold text-red-400 relative z-10"
                        >
                            {negativeCount}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-400">{negativeLabel}</span>
                    <ThumbsDown className="w-5 h-5 text-red-400" />
                </div>
            </div>
        </motion.div>
    );
}

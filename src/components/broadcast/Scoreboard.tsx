import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import { QuestionGroup, DebateTurn, Participant } from "@/types/debate";
import { cn } from "@/lib/utils";
import { CSSProperties, useEffect, useState, useRef, useCallback } from "react";

interface ScoreboardProps {
    questionGroups: QuestionGroup[];
    turns: DebateTurn[];
    participants: Participant[];
    currentTurnIndex: number;
    triggerAnimation?: boolean;
    className?: string;
    style?: CSSProperties;
}

interface FlyingAvatar {
    id: string;
    avatarUrl?: string;
    name: string;
    side: 'positive' | 'negative';
    targetX: number; // Exact X position relative to container
    targetY: number; // Exact Y position relative to container
}

export function Scoreboard({ questionGroups, turns, participants, currentTurnIndex, triggerAnimation, className, style }: ScoreboardProps) {
    const [flyingAvatar, setFlyingAvatar] = useState<FlyingAvatar | null>(null);
    const [displayedCounts, setDisplayedCounts] = useState({ positive: 0, negative: 0 });
    const [showCountUpdate, setShowCountUpdate] = useState<'positive' | 'negative' | null>(null);
    const lastTriggerRef = useRef(false);

    // Refs for calculating exact positions
    const containerRef = useRef<HTMLDivElement>(null);
    const positiveCountRef = useRef<HTMLDivElement>(null);
    const negativeCountRef = useRef<HTMLDivElement>(null);

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

    // Calculate exact target position for flying avatar
    const calculateTargetPosition = useCallback((side: 'positive' | 'negative') => {
        const container = containerRef.current;
        const target = side === 'positive' ? positiveCountRef.current : negativeCountRef.current;

        if (!container || !target) {
            // Fallback to approximate positions
            return { x: side === 'positive' ? -80 : 80, y: 0 };
        }

        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        // Calculate center of target relative to container center
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        return {
            x: targetCenterX - containerCenterX,
            y: targetCenterY - containerCenterY,
        };
    }, []);

    // Trigger animation when triggerAnimation becomes true
    useEffect(() => {
        if (triggerAnimation && !lastTriggerRef.current && currentParticipant && currentTurn?.decision) {
            console.log("[Scoreboard] Animation triggered for decision:", currentTurn.decision);

            // Calculate exact target position
            const side = currentTurn.decision as 'positive' | 'negative';
            const target = calculateTargetPosition(side);

            // Start flying avatar animation
            setFlyingAvatar({
                id: `${currentTurn.id}-${Date.now()}`,
                avatarUrl: currentParticipant.avatarUrl,
                name: currentParticipant.name,
                side,
                targetX: target.x,
                targetY: target.y,
            });

            // After flying animation (0.8s), update the count with pop animation
            setTimeout(() => {
                setShowCountUpdate(currentTurn.decision as 'positive' | 'negative');
                setDisplayedCounts(prev => ({
                    positive: currentTurn.decision === 'positive' ? prev.positive + 1 : prev.positive,
                    negative: currentTurn.decision === 'negative' ? prev.negative + 1 : prev.negative,
                }));

                // Play pop sound effect
                const popSound = new Audio('/audio effects/pop score.wav');
                popSound.volume = 0.5;
                popSound.play().catch(err => console.warn('[Scoreboard] Could not play pop sound:', err));
            }, 800);

            // Clear flying avatar
            setTimeout(() => {
                setFlyingAvatar(null);
            }, 900);

            // Clear count update highlight
            setTimeout(() => {
                setShowCountUpdate(null);
            }, 1400);
        }

        lastTriggerRef.current = !!triggerAnimation;
    }, [triggerAnimation, currentParticipant, currentTurn, calculateTargetPosition]);

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
            ref={containerRef}
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
                            scale: 1.2,
                            y: 120,
                            x: 0,
                        }}
                        animate={{
                            opacity: [1, 1, 0],
                            scale: [1.2, 0.6, 0.2],
                            y: [120, 40, flyingAvatar.targetY],
                            x: [0, flyingAvatar.targetX * 0.5, flyingAvatar.targetX],
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            duration: 0.85,
                            ease: [0.25, 0.1, 0.25, 1],
                            times: [0, 0.6, 1],
                        }}
                        className="absolute z-50 pointer-events-none"
                        style={{
                            left: '50%',
                            top: '50%',
                            marginLeft: '-32px', // Half of avatar width
                            marginTop: '-32px',  // Half of avatar height
                        }}
                    >
                        <motion.div
                            className={cn(
                                "w-16 h-16 rounded-full overflow-hidden border-4 shadow-xl",
                                flyingAvatar.side === 'positive'
                                    ? "border-green-400 shadow-green-500/70"
                                    : "border-red-400 shadow-red-500/70"
                            )}
                            animate={{
                                boxShadow: flyingAvatar.side === 'positive'
                                    ? ['0 0 20px rgba(74, 222, 128, 0.5)', '0 0 40px rgba(74, 222, 128, 0.8)', '0 0 60px rgba(74, 222, 128, 1)']
                                    : ['0 0 20px rgba(248, 113, 113, 0.5)', '0 0 40px rgba(248, 113, 113, 0.8)', '0 0 60px rgba(248, 113, 113, 1)'],
                            }}
                            transition={{ duration: 0.8 }}
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
                        </motion.div>

                        {/* Trailing glow effect */}
                        <motion.div
                            initial={{ opacity: 0.8, scale: 1 }}
                            animate={{ opacity: 0, scale: 2.5 }}
                            transition={{ duration: 0.6 }}
                            className={cn(
                                "absolute inset-0 rounded-full blur-md",
                                flyingAvatar.side === 'positive'
                                    ? "bg-green-400/60"
                                    : "bg-red-400/60"
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
                    ref={positiveCountRef}
                    animate={showCountUpdate === 'positive' ? {
                        scale: [1, 1.5, 1.1, 1],
                        rotate: [0, -8, 4, 0],
                    } : {}}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 12,
                    }}
                    className="relative w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center"
                >
                    {/* Impact flash on update */}
                    <AnimatePresence>
                        {showCountUpdate === 'positive' && (
                            <>
                                {/* Bright flash */}
                                <motion.div
                                    initial={{ opacity: 1, scale: 0.5 }}
                                    animate={{ opacity: 0, scale: 3 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute inset-0 rounded-full bg-green-400"
                                />
                                {/* Ripple 1 */}
                                <motion.div
                                    initial={{ opacity: 0.8, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2.5 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="absolute inset-0 rounded-full border-3 border-green-400"
                                />
                                {/* Ripple 2 */}
                                <motion.div
                                    initial={{ opacity: 0.6, scale: 1 }}
                                    animate={{ opacity: 0, scale: 3 }}
                                    transition={{ duration: 0.7, delay: 0.2 }}
                                    className="absolute inset-0 rounded-full border-2 border-green-400/70"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.span
                            key={positiveCount}
                            initial={{ opacity: 0, y: 20, scale: 0.3 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.3 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                            }}
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
                    ref={negativeCountRef}
                    animate={showCountUpdate === 'negative' ? {
                        scale: [1, 1.5, 1.1, 1],
                        rotate: [0, 8, -4, 0],
                    } : {}}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 12,
                    }}
                    className="relative w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
                >
                    {/* Impact flash on update */}
                    <AnimatePresence>
                        {showCountUpdate === 'negative' && (
                            <>
                                {/* Bright flash */}
                                <motion.div
                                    initial={{ opacity: 1, scale: 0.5 }}
                                    animate={{ opacity: 0, scale: 3 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute inset-0 rounded-full bg-red-400"
                                />
                                {/* Ripple 1 */}
                                <motion.div
                                    initial={{ opacity: 0.8, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2.5 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="absolute inset-0 rounded-full border-3 border-red-400"
                                />
                                {/* Ripple 2 */}
                                <motion.div
                                    initial={{ opacity: 0.6, scale: 1 }}
                                    animate={{ opacity: 0, scale: 3 }}
                                    transition={{ duration: 0.7, delay: 0.2 }}
                                    className="absolute inset-0 rounded-full border-2 border-red-400/70"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.span
                            key={negativeCount}
                            initial={{ opacity: 0, y: 20, scale: 0.3 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.3 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                            }}
                            className="text-2xl font-bold text-red-400 relative z-10"
                        >
                            {negativeCount}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-400">{negativeLabel}</span>
                    <ThumbsUp className="w-5 h-5 text-red-400" />
                </div>
            </div>
        </motion.div>
    );
}

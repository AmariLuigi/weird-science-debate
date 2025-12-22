import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings2,
    Type,
    Eye,
    Users,
    MessageSquare,
    ThumbsUp,
    Sparkles,
    AtSign,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { cn } from "@/lib/utils";

export function OutroCustomizationSection() {
    const { state, updateIntroOutroConfig } = useDebate();
    const { introOutroConfig } = state;
    const [isExpanded, setIsExpanded] = useState(false);

    if (!introOutroConfig.enableOutro) {
        return null;
    }

    const toggleItems = [
        {
            key: "showParticipants" as const,
            label: "Participant Avatars",
            description: "Show participant photos and names",
            icon: Users,
            value: introOutroConfig.showParticipants ?? true,
        },
        {
            key: "showWhoWonCTA" as const,
            label: '"Who Won?" Section',
            description: "Ask viewers to comment their winner",
            icon: MessageSquare,
            value: introOutroConfig.showWhoWonCTA ?? true,
        },
        {
            key: "showEngagementCTA" as const,
            label: "Engagement Prompts",
            description: "Like, Subscribe, Comment buttons",
            icon: ThumbsUp,
            value: introOutroConfig.showEngagementCTA ?? true,
        },
        {
            key: "showPoweredBy" as const,
            label: "Powered By Footer",
            description: '"Powered by Weird Science" branding',
            icon: Sparkles,
            value: introOutroConfig.showPoweredBy ?? true,
        },
    ];

    return (
        <div className="glass-panel p-4 mt-4">
            {/* Header - Collapsible */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
                <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-brand-sea" />
                    <h3 className="text-lg font-semibold text-white">Outro Customization</h3>
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="text-sm text-slate-400 mt-2 mb-4">
                            Customize what appears on your outro screen.
                        </p>

                        <div className="space-y-6">
                            {/* Section Visibility Toggles */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                    <Eye className="w-4 h-4" />
                                    <span>Section Visibility</span>
                                </div>

                                <div className="space-y-2">
                                    {toggleItems.map((item) => (
                                        <label
                                            key={item.key}
                                            className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon
                                                    className={cn(
                                                        "w-4 h-4 transition-colors",
                                                        item.value ? "text-primary" : "text-slate-500"
                                                    )}
                                                />
                                                <div>
                                                    <div className="text-sm text-white">{item.label}</div>
                                                    <div className="text-xs text-slate-500">{item.description}</div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={item.value}
                                                    onChange={(e) =>
                                                        updateIntroOutroConfig({ [item.key]: e.target.checked })
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-primary/30 peer-checked:border-primary/50 border border-slate-600 transition-all" />
                                                <div className="absolute top-1 left-1 w-4 h-4 bg-slate-400 rounded-full peer-checked:bg-primary peer-checked:translate-x-4 transition-all" />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Text Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                    <Type className="w-4 h-4" />
                                    <span>Custom Text</span>
                                </div>

                                <div className="space-y-3">
                                    {/* Outro Headline */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">
                                            Outro Headline
                                        </label>
                                        <input
                                            type="text"
                                            value={introOutroConfig.outroHeadline || ""}
                                            onChange={(e) =>
                                                updateIntroOutroConfig({ outroHeadline: e.target.value })
                                            }
                                            placeholder="Thanks for watching!"
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Participant Acknowledgment Text */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">
                                            Participant Section Title
                                        </label>
                                        <input
                                            type="text"
                                            value={introOutroConfig.participantAckText || ""}
                                            onChange={(e) =>
                                                updateIntroOutroConfig({ participantAckText: e.target.value })
                                            }
                                            placeholder="Thank you to our participants"
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* CTA Headline */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">
                                            CTA Headline
                                        </label>
                                        <input
                                            type="text"
                                            value={introOutroConfig.ctaHeadline || ""}
                                            onChange={(e) =>
                                                updateIntroOutroConfig({ ctaHeadline: e.target.value })
                                            }
                                            placeholder="Who Won?"
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* CTA Subtext */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">
                                            CTA Description
                                        </label>
                                        <input
                                            type="text"
                                            value={introOutroConfig.ctaSubtext || ""}
                                            onChange={(e) =>
                                                updateIntroOutroConfig({ ctaSubtext: e.target.value })
                                            }
                                            placeholder="Drop a comment and let us know which side made the stronger case!"
                                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Social Handle */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                    <AtSign className="w-4 h-4" />
                                    <span>Social Media</span>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">
                                        Channel Handle (optional)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                            @
                                        </span>
                                        <input
                                            type="text"
                                            value={introOutroConfig.socialHandle || ""}
                                            onChange={(e) =>
                                                updateIntroOutroConfig({ socialHandle: e.target.value.replace(/^@/, "") })
                                            }
                                            placeholder="YourChannel"
                                            className="w-full pl-7 pr-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Displayed in the engagement section
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

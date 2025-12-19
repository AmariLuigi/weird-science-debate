import { motion } from "framer-motion";
import { Monitor, Smartphone } from "lucide-react";
import { useDebate } from "@/context/DebateContext";
import { VideoFormat } from "@/types/debate";

interface FormatOption {
    id: VideoFormat;
    label: string;
    description: string;
    icon: React.ReactNode;
    aspectRatio: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
    {
        id: "standard",
        label: "Standard",
        description: "16:9 Horizontal",
        icon: <Monitor className="w-6 h-6" />,
        aspectRatio: "16/9",
    },
    {
        id: "shorts",
        label: "Shorts",
        description: "9:16 Vertical",
        icon: <Smartphone className="w-6 h-6" />,
        aspectRatio: "9/16",
    },
];

export function FormatSelector() {
    const { state, setVideoFormat } = useDebate();

    return (
        <div className="glass-panel p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Video Format</h3>
            <div className="flex gap-3">
                {FORMAT_OPTIONS.map((option) => {
                    const isSelected = state.videoFormat === option.id;
                    return (
                        <motion.button
                            key={option.id}
                            onClick={() => setVideoFormat(option.id)}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex flex-col items-center gap-3">
                                {/* Aspect ratio preview */}
                                <div
                                    className={`border-2 rounded transition-colors ${isSelected ? "border-primary" : "border-slate-500"
                                        }`}
                                    style={{
                                        aspectRatio: option.aspectRatio,
                                        width: option.id === "standard" ? "48px" : "27px",
                                    }}
                                />
                                <div className="text-center">
                                    <div
                                        className={`font-medium ${isSelected ? "text-primary" : "text-white"
                                            }`}
                                    >
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

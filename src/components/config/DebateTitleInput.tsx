import { motion } from "framer-motion";
import { Type } from "lucide-react";
import { TextInput } from "@/components/ui/TextInput";

interface DebateTitleInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DebateTitleInput({ value, onChange }: DebateTitleInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-brand-sea/20 to-primary/20 border border-primary/30">
          <Type className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-white">Debate Title</h2>
      </div>
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the debate title..."
        className="text-lg"
      />
      {value && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-sm text-slate-400"
        >
          This title will be displayed at the top of the broadcast view.
        </motion.p>
      )}
    </motion.div>
  );
}

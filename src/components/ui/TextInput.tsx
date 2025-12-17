import React from "react";
import { cn } from "@/lib/utils";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3",
            "text-white placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
            "transition-all duration-300",
            error &&
              "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";

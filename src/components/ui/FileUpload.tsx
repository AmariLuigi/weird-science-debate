import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, X, FileAudio, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept: string;
  onChange: (file: File | undefined) => void;
  value?: File;
  previewUrl?: string;
  type: "image" | "audio";
  className?: string;
  compact?: boolean;
}

export function FileUpload({
  accept,
  onChange,
  value,
  previewUrl,
  type,
  className,
  compact = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      onChange(file);
      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
    },
    [onChange],
  );

  const hasFile = !!value || !!previewUrl;

  if (type === "image") {
    return (
      <div className={cn("relative", className)}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <motion.button
          type="button"
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative overflow-hidden rounded-full border-2 border-dashed border-white/20",
            "hover:border-primary/50 transition-colors duration-300",
            "flex items-center justify-center bg-slate-800/50",
            compact ? "w-16 h-16" : "w-24 h-24",
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <Image className={compact ? "w-5 h-5" : "w-6 h-6"} />
              {!compact && <span className="text-xs">Upload</span>}
            </div>
          )}
        </motion.button>
        {hasFile && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute bg-red-500 hover:bg-red-400 rounded-full p-1",
              "transition-colors duration-200",
              compact ? "-top-1 -right-1" : "top-0 right-0",
            )}
          >
            <X className="w-3 h-3 text-white" />
          </motion.button>
        )}
      </div>
    );
  }

  // Audio file upload
  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <motion.div
        onClick={hasFile ? undefined : handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 cursor-pointer",
          "bg-slate-800/50 border border-white/10 rounded-lg",
          "hover:border-primary/50 hover:bg-slate-800/70",
          "transition-all duration-300",
          hasFile && "border-primary/30 bg-primary/5",
        )}
      >
        {hasFile ? (
          <>
            <FileAudio className="w-5 h-5 text-primary" />
            <span
              className="text-sm text-white truncate flex-1 text-left cursor-pointer"
              onClick={handleClick}
            >
              {value?.name || "Audio file"}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleClear(e as unknown as React.MouseEvent)
              }
              className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-white" />
            </span>
          </>
        ) : (
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400">Upload audio file</span>
            </div>
            <span className="text-xs text-slate-500 ml-7">
              Any format (auto-converts to MP3)
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

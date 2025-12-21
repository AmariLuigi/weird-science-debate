import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Music,
  Volume2,
  Play,
  Pause,
  X,
  Upload,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import { useDebate } from "@/context/DebateContext";

export function AudioEnhancementsSection() {
  const { state, updateIntroOutroConfig } = useDebate();
  const { introOutroConfig } = state;

  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (
    type: "introMusic" | "outroMusic" | "transitionSound",
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "introMusic") {
        updateIntroOutroConfig({ introMusicFile: file });
      } else if (type === "outroMusic") {
        updateIntroOutroConfig({ outroMusicFile: file });
      } else {
        updateIntroOutroConfig({ transitionSoundFile: file });
      }
    }
  };

  const handleRemoveFile = (type: "introMusic" | "outroMusic" | "transitionSound") => {
    if (type === "introMusic") {
      updateIntroOutroConfig({ introMusicFile: undefined });
    } else if (type === "outroMusic") {
      updateIntroOutroConfig({ outroMusicFile: undefined });
    } else {
      updateIntroOutroConfig({ transitionSoundFile: undefined });
    }
  };

  const handleVolumeChange = (
    type: "introMusic" | "outroMusic" | "transitionSound",
    value: number,
  ) => {
    if (type === "introMusic") {
      updateIntroOutroConfig({ introMusicVolume: value });
    } else if (type === "outroMusic") {
      updateIntroOutroConfig({ outroMusicVolume: value });
    } else {
      updateIntroOutroConfig({ transitionSoundVolume: value });
    }
  };

  const handleToggle = (type: "intro" | "outro") => {
    if (type === "intro") {
      updateIntroOutroConfig({ enableIntro: !introOutroConfig.enableIntro });
    } else {
      updateIntroOutroConfig({ enableOutro: !introOutroConfig.enableOutro });
    }
  };

  const handlePreview = (url: string | undefined, id: string) => {
    if (!url) return;

    if (playingPreview === id) {
      audioPreviewRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      audioPreviewRef.current = new Audio(url);
      audioPreviewRef.current.volume = 0.5;
      audioPreviewRef.current.play();
      audioPreviewRef.current.onended = () => setPlayingPreview(null);
      setPlayingPreview(id);
    }
  };

  const renderAudioUpload = (
    type: "introMusic" | "outroMusic" | "transitionSound",
    label: string,
    icon: React.ReactNode,
    file: File | undefined,
    url: string | undefined,
    volume: number,
  ) => {
    const id = type;
    const isPlaying = playingPreview === id;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-white">{label}</span>
          </div>
          {url && (
            <button
              onClick={() => handlePreview(url, id)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary" />
              ) : (
                <Play className="w-4 h-4 text-slate-400 hover:text-primary" />
              )}
            </button>
          )}
        </div>

        {file ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-primary/30 rounded-lg">
            <Music className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{file.name}</div>
              <div className="text-xs text-slate-400">Audio file</div>
            </div>
            <button
              onClick={() => handleRemoveFile(type)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 border border-dashed border-slate-600 rounded-lg hover:border-primary/50 hover:bg-slate-800/50 transition-all cursor-pointer">
            <Upload className="w-5 h-5 text-slate-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-400">Upload audio</div>
              <div className="text-xs text-slate-500">MP3, WAV</div>
            </div>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileChange(type, e)}
              className="hidden"
            />
          </label>
        )}

        {file && (
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(type, parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs text-slate-400 w-10 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">Audio Enhancements</h3>
      </div>

      <p className="text-sm text-slate-400 mb-6">
        Add background music for intro/outro sequences and transition sounds between turns.
      </p>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={introOutroConfig.enableIntro}
              onChange={() => handleToggle("intro")}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary/50"
            />
            <span className="text-sm text-white">Enable Intro Sequence</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={introOutroConfig.enableOutro}
              onChange={() => handleToggle("outro")}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary/50"
            />
            <span className="text-sm text-white">Enable Outro Sequence</span>
          </label>
        </div>

        {introOutroConfig.enableIntro && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {renderAudioUpload(
              "introMusic",
              "Intro Background Music",
              <Sparkles className="w-4 h-4 text-brand-sea" />,
              introOutroConfig.introMusicFile,
              introOutroConfig.introMusicUrl,
              introOutroConfig.introMusicVolume,
            )}
          </motion.div>
        )}

        {introOutroConfig.enableOutro && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {renderAudioUpload(
              "outroMusic",
              "Outro Background Music",
              <Sparkles className="w-4 h-4 text-primary" />,
              introOutroConfig.outroMusicFile,
              introOutroConfig.outroMusicUrl,
              introOutroConfig.outroMusicVolume,
            )}

            {/* Outro Video Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-brand-sea" />
                <span className="text-sm font-medium text-white">Outro Host Video</span>
              </div>

              {introOutroConfig.outroVideoFile || introOutroConfig.outroVideoUrl ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-primary/30 rounded-lg">
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-slate-700">
                    <video
                      src={introOutroConfig.outroVideoUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {introOutroConfig.outroVideoFile?.name ||
                        (introOutroConfig.outroVideoUrl ? decodeURIComponent(introOutroConfig.outroVideoUrl.split('/').pop() || 'Video') : 'Video')}
                    </div>
                    <div className="text-xs text-slate-400">Video file</div>
                  </div>
                  <button
                    onClick={() => updateIntroOutroConfig({ outroVideoFile: undefined, outroVideoUrl: undefined })}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 border border-dashed border-slate-600 rounded-lg hover:border-primary/50 hover:bg-slate-800/50 transition-all cursor-pointer">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-400">Upload video</div>
                    <div className="text-xs text-slate-500">MP4, WebM</div>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateIntroOutroConfig({ outroVideoFile: file });
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-slate-500">
                Host video shown in circular avatar during outro (optional)
              </p>
            </div>
          </motion.div>
        )}

        <div className="pt-4 border-t border-white/10">
          {renderAudioUpload(
            "transitionSound",
            "Turn Transition Sound",
            <ArrowRightLeft className="w-4 h-4 text-slate-400" />,
            introOutroConfig.transitionSoundFile,
            introOutroConfig.transitionSoundUrl,
            introOutroConfig.transitionSoundVolume,
          )}
          <p className="text-xs text-slate-500 mt-2">
            Short sound effect played when switching between speakers (optional)
          </p>
        </div>
      </div>
    </div>
  );
}

import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoVisualizerProps {
  videoUrl: string;
  isActive: boolean;
  size: number;
  className?: string;
  color?: "mint" | "teal";
  isPlaying: boolean;
  playbackSpeed?: number; // Playback rate (0.5 to 2.0, default 1.0)
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function VideoVisualizer({
  videoUrl,
  isActive,
  size,
  className,
  color = "teal",
  isPlaying,
  playbackSpeed = 1,
  onEnded,
  onTimeUpdate,
}: VideoVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isAudioConnected, setIsAudioConnected] = useState(false);

  // Setup canvas with proper DPR handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    // Set the canvas internal size (actual pixels)
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Set the canvas display size (CSS pixels)
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // Scale the context to account for DPR
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [size]);

  // Initialize audio context and connect video to analyser
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isAudioConnected) return;

    const initAudio = () => {
      if (audioContextRef.current || !video) return;

      try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioContext.createMediaElementSource(video);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;
        setIsAudioConnected(true);

        console.log("[VideoVisualizer] Audio context initialized");
      } catch (err) {
        console.error("[VideoVisualizer] Failed to init audio context:", err);
      }
    };

    // Initialize on first user interaction or when video can play
    video.addEventListener("canplay", initAudio, { once: true });

    return () => {
      video.removeEventListener("canplay", initAudio);
    };
  }, [videoUrl, isAudioConnected]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
    };
  }, []);

  // Sync video playback with audio state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && isActive) {
      // Resume audio context if suspended
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      // Set playback speed before playing
      video.playbackRate = playbackSpeed;

      video.play().catch((err) => {
        console.warn("[VideoVisualizer] Failed to play video:", err);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, isActive, playbackSpeed]);

  // Reset video when it becomes active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
    }
  }, [isActive]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      console.log("[VideoVisualizer] Video ended");
      onEnded?.();
    };

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime, video.duration || 0);
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [onEnded, onTimeUpdate]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext("2d");
    const analyser = analyserRef.current;

    if (!canvas || !ctx) {
      animationFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Clear canvas (use scaled dimensions)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for clearing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // All drawing uses CSS pixel coordinates (context is already scaled)
    const centerX = size / 2;
    const centerY = size / 2;

    // Calculate radii based on size (not hardcoded)
    const avatarRadius = (size / 2) - 20; // Leave some padding from edge
    const videoRadius = avatarRadius - 5; // Video slightly inside avatar bounds
    const visualizerRadius = avatarRadius + 5; // Ring sits outside avatar
    const barCount = 64;
    const barWidth = Math.max(2, size / 100); // Scale bar width with size
    const maxBarHeight = size / 12; // Scale bar height with size

    // Draw video inside circular mask if video is ready
    if (video && video.readyState >= 2) {
      ctx.save();

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(centerX, centerY, videoRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate aspect ratio to cover the circle
      const videoAspect = video.videoWidth / video.videoHeight;
      const targetSize = videoRadius * 2;

      let drawWidth, drawHeight, drawX, drawY;

      if (videoAspect > 1) {
        // Video is wider than tall
        drawHeight = targetSize;
        drawWidth = targetSize * videoAspect;
        drawX = centerX - drawWidth / 2;
        drawY = centerY - drawHeight / 2;
      } else {
        // Video is taller than wide
        drawWidth = targetSize;
        drawHeight = targetSize / videoAspect;
        drawX = centerX - drawWidth / 2;
        drawY = centerY - drawHeight / 2;
      }

      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Draw circular border around video - brand colors
      ctx.beginPath();
      ctx.arc(centerX, centerY, videoRadius, 0, Math.PI * 2);
      ctx.strokeStyle =
        color === "teal"
          ? "rgba(2, 89, 81, 0.6)" // brand-teal
          : "rgba(12, 242, 93, 0.6)"; // brand-mint (primary)
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      // Fallback: draw placeholder circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, videoRadius, 0, Math.PI * 2);
      ctx.fillStyle =
        color === "teal"
          ? "rgba(3, 65, 89, 0.5)" // brand-dark
          : "rgba(2, 115, 94, 0.5)"; // brand-sea
      ctx.fill();
      ctx.strokeStyle =
        color === "teal"
          ? "rgba(2, 89, 81, 0.4)" // brand-teal
          : "rgba(12, 242, 93, 0.4)"; // brand-mint
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw audio-reactive visualizer around the video
    if (analyser) {
      // Initialize data array if needed
      if (!dataArrayRef.current) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }

      // Get frequency data
      analyser.getByteFrequencyData(dataArrayRef.current);

      // Color configurations - Brand palette teal to mint
      const colors = {
        mint: {
          active: [
            { stop: 0, color: "rgba(2, 115, 94, 0.8)" }, // brand-sea
            { stop: 0.5, color: "rgba(3, 140, 62, 0.9)" }, // brand-green
            { stop: 1, color: "rgba(12, 242, 93, 1)" }, // brand-mint (primary)
          ],
          ring: "rgba(12, 242, 93, 0.3)",
          outerGlow: "rgba(12, 242, 93, 0.1)",
        },
        teal: {
          active: [
            { stop: 0, color: "rgba(3, 65, 89, 0.8)" }, // brand-dark
            { stop: 0.5, color: "rgba(2, 89, 81, 0.9)" }, // brand-teal
            { stop: 1, color: "rgba(2, 115, 94, 1)" }, // brand-sea
          ],
          ring: "rgba(2, 89, 81, 0.3)",
          outerGlow: "rgba(2, 89, 81, 0.1)",
        },
      };

      const colorConfig = colors[color];

      // Draw circular visualizer bars
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(
          (i / barCount) * dataArrayRef.current.length,
        );
        const value = dataArrayRef.current[dataIndex];
        const normalizedValue = value / 255;

        // Apply activity modifier
        const activityMultiplier = isActive ? 1 : 0.1;
        const barHeight = normalizedValue * maxBarHeight * activityMultiplier;

        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;

        const innerRadius = visualizerRadius;
        const outerRadius = visualizerRadius + barHeight;

        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

        if (isActive) {
          colorConfig.active.forEach(({ stop, color: stopColor }) => {
            gradient.addColorStop(stop, stopColor);
          });
        } else {
          gradient.addColorStop(0, "rgba(100, 116, 139, 0.2)");
          gradient.addColorStop(1, "rgba(100, 116, 139, 0.1)");
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = barWidth;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Draw glowing ring when active
      if (isActive) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, visualizerRadius - 2, 0, Math.PI * 2);
        ctx.strokeStyle = colorConfig.ring;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add outer glow
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          visualizerRadius + maxBarHeight + 5,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = colorConfig.outerGlow;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [isActive, color]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Video element - not hidden, but positioned behind canvas */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute opacity-0 pointer-events-none"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Canvas with video and visualizer - centered */}
      <canvas
        ref={canvasRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}

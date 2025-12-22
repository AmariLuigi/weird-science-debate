import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CircularVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  size: number;
  className?: string;
  color?: "mint" | "teal";
}

export function CircularVisualizer({
  analyserNode,
  isActive,
  size,
  className,
  color = "mint",
}: CircularVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      animationFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Initialize data array if needed
    if (analyserNode && !dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    }

    // Get frequency data if available
    if (analyserNode && dataArrayRef.current) {
      analyserNode.getByteFrequencyData(dataArrayRef.current);
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
    // Avatar takes ~65% of the container, ring sits just outside
    const avatarRadius = (size / 2) * 0.65; // Avatar radius relative to size
    const ringRadius = avatarRadius + 5; // Ring sits 5px outside avatar edge
    const barCount = 64;
    const barWidth = Math.max(2, size / 100); // Scale bar width with size
    const maxBarHeight = size / 10; // Scale bar height with size

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
      let normalizedValue = 0;

      if (dataArrayRef.current && dataArrayRef.current.length > 0) {
        const dataIndex = Math.floor(
          (i / barCount) * dataArrayRef.current.length,
        );
        const value = dataArrayRef.current[dataIndex];
        normalizedValue = value / 255;
      }

      // Apply activity modifier
      const activityMultiplier = isActive ? 1 : 0.1;
      const barHeight = normalizedValue * maxBarHeight * activityMultiplier;

      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;

      const innerRadius = ringRadius;
      const outerRadius = ringRadius + barHeight;

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
      ctx.arc(centerX, centerY, ringRadius - 2, 0, Math.PI * 2);
      ctx.strokeStyle = colorConfig.ring;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add outer glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius + maxBarHeight + 5, 0, Math.PI * 2);
      ctx.strokeStyle = colorConfig.outerGlow;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [analyserNode, isActive, color, size]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

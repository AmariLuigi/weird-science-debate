import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CircularVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  size: number;
  className?: string;
  color?: "cyan" | "purple";
}

export function CircularVisualizer({
  analyserNode,
  isActive,
  size,
  className,
  color = "cyan",
}: CircularVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || !analyserNode) {
      animationFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Initialize data array if needed
    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    }

    // Get frequency data
    analyserNode.getByteFrequencyData(dataArrayRef.current);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;
    const barCount = 64;
    const barWidth = 3;
    const maxBarHeight = 30;

    // Color configurations
    const colors = {
      cyan: {
        active: [
          { stop: 0, color: "rgba(0, 245, 255, 0.8)" },
          { stop: 0.5, color: "rgba(191, 0, 255, 0.9)" },
          { stop: 1, color: "rgba(255, 0, 229, 1)" },
        ],
        ring: "rgba(0, 245, 255, 0.3)",
        outerGlow: "rgba(0, 245, 255, 0.1)",
      },
      purple: {
        active: [
          { stop: 0, color: "rgba(191, 0, 255, 0.8)" },
          { stop: 0.5, color: "rgba(255, 0, 229, 0.9)" },
          { stop: 1, color: "rgba(255, 100, 255, 1)" },
        ],
        ring: "rgba(191, 0, 255, 0.3)",
        outerGlow: "rgba(191, 0, 255, 0.1)",
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

      const innerRadius = radius;
      const outerRadius = radius + barHeight;

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
      ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      ctx.strokeStyle = colorConfig.ring;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add outer glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + maxBarHeight + 5, 0, Math.PI * 2);
      ctx.strokeStyle = colorConfig.outerGlow;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [analyserNode, isActive, color]);

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

import { useRef, useCallback, useEffect } from "react";

interface UseCircularVisualizerOptions {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  canvasSize: number;
  barCount?: number;
  innerRadius?: number;
  barWidth?: number;
  barMaxHeight?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export function useCircularVisualizer({
  analyserNode,
  isActive,
  canvasSize,
  barCount = 64,
  innerRadius = 0.65,
  barWidth = 3,
  barMaxHeight = 30,
  primaryColor = "#00f5ff",
  secondaryColor = "#bf00ff",
}: UseCircularVisualizerOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || !analyserNode || !isActive) {
      // Draw static ring when not active
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius =
          (Math.min(canvas.width, canvas.height) / 2) * innerRadius;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
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
    const radius = (Math.min(canvas.width, canvas.height) / 2) * innerRadius;

    // Draw visualizer bars
    const angleStep = (Math.PI * 2) / barCount;
    const dataStep = Math.floor(dataArrayRef.current.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = dataArrayRef.current[dataIndex] / 255;
      const barHeight = value * barMaxHeight;

      const angle = i * angleStep - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, secondaryColor);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = barWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      // Add glow effect for high values
      if (value > 0.5) {
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = value * 15;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Draw inner glow ring
    const avgValue =
      dataArrayRef.current.reduce((a, b) => a + b, 0) /
      dataArrayRef.current.length /
      255;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    const ringGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.8,
      centerX,
      centerY,
      radius,
    );
    ringGradient.addColorStop(0, "transparent");
    ringGradient.addColorStop(1, `rgba(0, 245, 255, ${avgValue * 0.5})`);
    ctx.strokeStyle = `rgba(0, 245, 255, ${0.3 + avgValue * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Request next frame
    animationFrameRef.current = requestAnimationFrame(draw);
  }, [
    analyserNode,
    isActive,
    barCount,
    innerRadius,
    barWidth,
    barMaxHeight,
    primaryColor,
    secondaryColor,
  ]);

  // Start/stop animation based on isActive
  useEffect(() => {
    if (isActive && analyserNode) {
      animationFrameRef.current = requestAnimationFrame(draw);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Draw static state once
      draw();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, analyserNode, draw]);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
    }
  }, [canvasSize]);

  return {
    canvasRef,
  };
}

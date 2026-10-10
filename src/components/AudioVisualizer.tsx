import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  getFrequencyData?: () => Uint8Array | null;
  accentColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording,
  getFrequencyData,
  accentColor = '#10b981', // Emerald
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!isRecording) {
        // Subtle resting idle wave
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x += 5) {
          const y = height / 2 + Math.sin(x * 0.03 + phase) * 2;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        phase += 0.03;
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const freqData = getFrequencyData ? getFrequencyData() : null;

      if (freqData && freqData.length > 0) {
        // Draw frequency bars
        const barWidth = (width / 32);
        let barX = 0;

        for (let i = 0; i < 32; i++) {
          const index = Math.floor((i / 32) * (freqData.length / 2));
          const val = freqData[index] || 0;
          const barHeight = Math.max(4, (val / 255) * (height * 0.85));

          const gradient = ctx.createLinearGradient(0, height / 2 - barHeight / 2, 0, height / 2 + barHeight / 2);
          gradient.addColorStop(0, '#06b6d4'); // Cyan
          gradient.addColorStop(1, '#10b981'); // Emerald

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(barX + 2, height / 2 - barHeight / 2, barWidth - 4, barHeight, 4);
          ctx.fill();

          barX += barWidth;
        }
      } else {
        // Smooth animated audio wave if no direct freq data available
        ctx.beginPath();
        ctx.lineWidth = 3;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.5, '#10b981');
        grad.addColorStop(1, '#3b82f6');
        ctx.strokeStyle = grad;

        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x += 3) {
          const amp = 14 + Math.sin(phase * 1.5) * 8;
          const y = height / 2 + Math.sin(x * 0.05 + phase) * Math.cos(x * 0.02 + phase * 0.7) * amp;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        phase += 0.12;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, getFrequencyData, accentColor]);

  return (
    <div className="relative w-full h-16 flex items-center justify-center bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden backdrop-blur-sm px-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={64}
        className="w-full h-full"
      />
      {isRecording && (
        <div className="absolute top-2 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-medium animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>تۆماری دەنگ...</span>
        </div>
      )}
    </div>
  );
};

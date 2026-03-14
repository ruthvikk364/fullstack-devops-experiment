"use client";

import { useRef, useEffect } from "react";

interface WaveformProps {
  isActive: boolean;
  color: string;
  width?: number;
  height?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export default function Waveform({
  isActive,
  color,
  width = 320,
  height = 80,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const ampRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const [r, g, b] = hexToRgb(color);
    const startTime = performance.now();

    const loop = (now: number) => {
      const t = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const targetAmp = isActive ? 1 : 0.08;
      ampRef.current += (targetAmp - ampRef.current) * 0.05;
      const amp = ampRef.current;
      const cy = height / 2;

      // ── Smooth flowing waves ──
      for (let wave = 0; wave < 3; wave++) {
        const waveAmp = amp * (0.8 - wave * 0.2);
        const alpha = (0.6 - wave * 0.15) * amp + 0.03;
        const speed = 2.5 + wave * 0.7;
        const freq = 0.015 + wave * 0.004;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 2.5 - wave * 0.7;
        ctx.lineCap = "round";

        for (let x = 0; x <= width; x += 1) {
          const normalX = x / width;
          const envelope = Math.sin(normalX * Math.PI);
          const envelope2 = Math.pow(envelope, 0.8); // flatter peak
          const y =
            cy +
            Math.sin(x * freq * Math.PI * 2 + t * speed) *
              (height * 0.35 * waveAmp * envelope2) +
            Math.sin(x * freq * 1.6 * Math.PI * 2 - t * speed * 0.7) *
              (height * 0.15 * waveAmp * envelope2);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // ── Vertical bars ──
      const numBars = 48;
      const barW = (width / numBars) * 0.45;
      const gap = width / numBars;

      for (let i = 0; i < numBars; i++) {
        const x = i * gap + gap * 0.275;
        const normalPos = i / numBars;
        const envelope = Math.pow(Math.sin(normalPos * Math.PI), 0.8);

        const val =
          Math.sin(normalPos * 7 + t * 3.5) * 0.45 +
          Math.sin(normalPos * 12 - t * 5) * 0.3 +
          Math.sin(normalPos * 18 + t * 7) * 0.15 +
          (isActive ? Math.sin(i * 73.7 + t * 9) * 0.1 : 0);

        const barH = Math.max(2, Math.abs(val) * height * 0.5 * amp * envelope + 2);
        const barAlpha = (0.1 + Math.abs(val) * 0.5) * amp + 0.02;

        const grad = ctx.createLinearGradient(x, cy - barH / 2, x, cy + barH / 2);
        grad.addColorStop(0, `rgba(${r},${g},${b},${barAlpha * 0.2})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${barAlpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${barAlpha * 0.2})`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, cy - barH / 2, barW, barH, barW / 2);
        ctx.fill();
      }

      // ── Center line ──
      const lineAlpha = 0.04 + amp * 0.03;
      ctx.strokeStyle = `rgba(${r},${g},${b},${lineAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-none"
    />
  );
}

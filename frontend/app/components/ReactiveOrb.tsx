"use client";

import { useRef, useEffect } from "react";

interface ReactiveOrbProps {
  color: string;
  isActive: boolean;
  size?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export default function ReactiveOrb({
  color,
  isActive,
  size = 280,
}: ReactiveOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const intensityRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const [r, g, b] = hexToRgb(color);
    const startTime = performance.now();

    const loop = (now: number) => {
      const t = (now - startTime) / 1000;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const baseRadius = size * 0.2;

      // Smooth intensity ramp
      const target = isActive ? 1 : 0;
      intensityRef.current += (target - intensityRef.current) * 0.035;
      const intensity = intensityRef.current;

      // ── Wide ambient glow ──
      const glowR = baseRadius * (2.5 + intensity * 0.8);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${r},${g},${b},${0.1 + intensity * 0.12})`);
      glow.addColorStop(0.3, `rgba(${r},${g},${b},${0.04 + intensity * 0.06})`);
      glow.addColorStop(0.7, `rgba(${r},${g},${b},${0.01 + intensity * 0.02})`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // ── Blob layers ──
      const numLayers = 7;
      for (let layer = numLayers - 1; layer >= 0; layer--) {
        const frac = layer / numLayers;
        const layerR =
          baseRadius * (0.35 + frac * 0.75) +
          Math.sin(t * 0.6 + layer * 0.7) * (2 + intensity * 6);

        const points = 200;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;

          // Smooth low-frequency distortion
          const d1 = Math.sin(angle * 2 + t * 0.5 + layer * 0.9) * (4 + intensity * 14);
          const d2 = Math.sin(angle * 3 - t * 0.7 + layer * 1.4) * (2.5 + intensity * 10);
          const d3 = Math.cos(angle * 2 + t * 0.9 + layer * 0.3) * (1.5 + intensity * 6);
          // Extra breathing when active
          const d4 = intensity * Math.sin(angle * 4 + t * 1.6) * 5;

          const rad = layerR + d1 + d2 + d3 + d4;
          const x = cx + Math.cos(angle) * rad;
          const y = cy + Math.sin(angle) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const alpha = 0.04 + (1 - frac) * 0.16 + intensity * 0.06;
        // Shift gradient center for depth
        const gx = cx + Math.sin(t * 0.4 + layer) * 8;
        const gy = cy + Math.cos(t * 0.3 + layer) * 8;
        const grad = ctx.createRadialGradient(gx, gy, 0, cx, cy, layerR * 2);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 1.2})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // ── Bright core ──
      const coreR = baseRadius * (0.3 + intensity * 0.06);
      const corePulse = 1 + Math.sin(t * 2) * 0.05 * (1 + intensity * 2);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * corePulse);
      core.addColorStop(0, `rgba(255,255,255,${0.4 + intensity * 0.35})`);
      core.addColorStop(0.25, `rgba(${r},${g},${b},${0.35 + intensity * 0.3})`);
      core.addColorStop(0.6, `rgba(${r},${g},${b},${0.08 + intensity * 0.1})`);
      core.addColorStop(1, "transparent");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // ── Expanding rings when active ──
      if (intensity > 0.05) {
        for (let i = 0; i < 3; i++) {
          const phase = (t * 0.5 + i / 3) % 1;
          const ringR = baseRadius * (0.5 + phase * 1.8);
          const ringAlpha = (1 - phase) * (1 - phase) * 0.15 * intensity;
          ctx.strokeStyle = `rgba(${r},${g},${b},${ringAlpha})`;
          ctx.lineWidth = 1.5 * (1 - phase);
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ── Floating particles when active ──
      if (intensity > 0.15) {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
          const a = (i / particleCount) * Math.PI * 2 + t * (0.2 + i * 0.05);
          const dist = baseRadius * (0.9 + Math.sin(t * 1.2 + i * 2) * 0.4);
          const px = cx + Math.cos(a) * dist;
          const py = cy + Math.sin(a) * dist;
          const pSize = (1 + Math.sin(t * 3 + i) * 0.5) * intensity;
          const pAlpha = 0.25 * intensity * (0.5 + Math.sin(t * 2 + i * 1.5) * 0.5);

          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${pAlpha})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [color, isActive, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none"
    />
  );
}

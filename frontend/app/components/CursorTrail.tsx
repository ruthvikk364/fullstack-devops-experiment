"use client";

import { useEffect, useRef } from "react";

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const trail: { x: number; y: number; age: number }[] = [];
    const mouse = { x: -100, y: -100 };
    const maxAge = 18;

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -100;
      mouse.y = -100;
    };
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    let frame = 0;
    let animId: number;

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      frame++;

      if (frame % 2 === 0 && mouse.x > 0) {
        trail.push({ x: mouse.x, y: mouse.y, age: 0 });
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age++;
        if (trail[i].age > maxAge) {
          trail.splice(i, 1);
          continue;
        }

        const t = trail[i].age / maxAge;
        const alpha = (1 - t) * 0.5;
        const size = (1 - t) * 6 + 2;

        // Orange-violet gradient based on position in trail
        const r = Math.round(251 - t * 84);
        const g = Math.round(146 - t * 7);
        const b = Math.round(60 + t * 190);

        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[55]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

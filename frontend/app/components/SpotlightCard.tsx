"use client";

import { useRef, useState } from "react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: (e: React.MouseEvent) => void;
  "data-agent-card"?: boolean;
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(167, 139, 250, 0.08)",
  onClick,
  "data-agent-card": dataAgentCard,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, active: false });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouse}
      onMouseLeave={() => setSpotlight((s) => ({ ...s, active: false }))}
      onClick={onClick}
      {...(dataAgentCard ? { "data-agent-card": "" } : {})}
      style={{
        transform: spotlight.active
          ? `perspective(800px) rotateY(${(spotlight.x - (ref.current?.offsetWidth || 0) / 2) * 0.015}deg) rotateX(${-(spotlight.y - (ref.current?.offsetHeight || 0) / 2) * 0.015}deg)`
          : "perspective(800px) rotateY(0deg) rotateX(0deg)",
        transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Spotlight gradient that follows cursor */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          opacity: spotlight.active ? 1 : 0,
          background: `radial-gradient(400px circle at ${spotlight.x}px ${spotlight.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}

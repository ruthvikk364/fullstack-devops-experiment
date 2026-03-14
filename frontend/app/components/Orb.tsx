"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { ORB_THEMES } from "@/app/lib/orb-themes";
import type { OrbTheme } from "@/app/lib/orb-themes";

const DEFAULT_SIZE = 100;

export type OrbState = "idle" | "listening" | "speaking" | "connecting";

interface OrbProps {
  size?: number;
  className?: string;
  audioLevelRef?: React.RefObject<number>;
  orbState?: OrbState;
  theme?: string;
}

interface Cluster {
  angle: number;
  dist: number;
  driftSpeed: number;
  driftPhase: number;
  spread: number;
}

interface Particle {
  clusterId: number;
  localAngle: number;
  localDist: number;
  orbitSpeed: number;
  r: number;
  isStar: boolean;
  fadeFreq: number;
  fadePhase: number;
  maxAlpha: number;
  sparkleFreq: number;
  sparklePhase: number;
  tint: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeClusters(rand: () => number, theme: OrbTheme): Cluster[] {
  return Array.from({ length: theme.clusterCount }, () => ({
    angle: rand() * Math.PI * 2,
    dist: 0.08 + rand() * 0.3,
    driftSpeed: theme.driftSpeedRange[0] + rand() * (theme.driftSpeedRange[1] - theme.driftSpeedRange[0]),
    driftPhase: rand() * Math.PI * 2,
    spread: 0.03 + rand() * 0.06,
  }));
}

function makeParticles(theme: OrbTheme): { clusters: Cluster[]; particles: Particle[] } {
  const rand = seededRandom(54321);
  const clusters = makeClusters(rand, theme);
  const particles: Particle[] = [];
  const [pMin, pMax] = theme.particlesPerCluster;
  const orbitRange = theme.orbitSpeedRange;

  for (let ci = 0; ci < clusters.length; ci++) {
    const count = pMin + Math.floor(rand() * (pMax - pMin + 1));
    for (let j = 0; j < count; j++) {
      const isStar = rand() < theme.starChance;
      particles.push({
        clusterId: ci,
        localAngle: rand() * Math.PI * 2,
        localDist: rand() * rand(),
        orbitSpeed: (orbitRange[0] + rand() * (orbitRange[1] - orbitRange[0])) * (rand() < 0.5 ? 1 : -1),
        r: isStar ? 0.008 + rand() * 0.006 : 0.003 + rand() * 0.004,
        isStar,
        fadeFreq: 0.15 + rand() * 0.3,
        fadePhase: rand() * Math.PI * 2,
        maxAlpha: isStar ? 0.7 + rand() * 0.3 : 0.3 + rand() * 0.5,
        sparkleFreq: isStar ? 1.5 + rand() * 2.5 : 0.5 + rand() * 1.5,
        sparklePhase: rand() * Math.PI * 2,
        tint: Math.floor(rand() * theme.tints.length),
      });
    }
  }

  for (let i = 0; i < theme.freeParticles; i++) {
    const isStar = rand() < theme.starChance * 1.5;
    particles.push({
      clusterId: -1,
      localAngle: rand() * Math.PI * 2,
      localDist: 0.04 + rand() * 0.4,
      orbitSpeed: 0.02 + rand() * 0.08,
      r: isStar ? 0.007 + rand() * 0.005 : 0.002 + rand() * 0.004,
      isStar,
      fadeFreq: 0.1 + rand() * 0.25,
      fadePhase: rand() * Math.PI * 2,
      maxAlpha: isStar ? 0.6 + rand() * 0.3 : 0.2 + rand() * 0.4,
      sparkleFreq: 0.3 + rand() * 1.0,
      sparklePhase: rand() * Math.PI * 2,
      tint: Math.floor(rand() * theme.tints.length),
    });
  }

  return { clusters, particles };
}

export default function Orb({
  size,
  className = "",
  audioLevelRef: externalAudioRef,
  orbState,
  theme: themeName,
}: OrbProps) {
  const sz = size || DEFAULT_SIZE;
  const resolvedTheme = useMemo(() => ORB_THEMES[themeName || "sapphire"] || ORB_THEMES.sapphire, [themeName]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const speedRef = useRef(1);
  const audioRef = useRef(0);
  const fallbackAudioRef = useRef(0);
  const audioLevelPropRef = externalAudioRef || fallbackAudioRef;
  const orbStateRef = useRef<OrbState | undefined>(orbState);

  const { clusters, particles } = useMemo(() => makeParticles(resolvedTheme), [resolvedTheme]);

  useEffect(() => {
    orbStateRef.current = orbState;
  }, [orbState]);

  useEffect(() => {
    const id = setInterval(() => {
      const st = orbStateRef.current;
      let target = 1.0;
      if (st === "speaking") target = 2.0;
      else if (st === "listening") target = 0.7;
      speedRef.current += (target - speedRef.current) * 0.04;
    }, 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = sz * dpr;
    cvs.height = sz * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const c = sz / 2;
    const R = c;

    const drawCloud = (
      x: number, y: number, s: number,
      rgb: [number, number, number], a: number
    ) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, s);
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
      g.addColorStop(0.35, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a * 0.85})`);
      g.addColorStop(0.6, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a * 0.55})`);
      g.addColorStop(0.8, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a * 0.2})`);
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, sz, sz);
    };

    const loop = () => {
      const rawAudio = audioLevelPropRef.current;
      const prev = audioRef.current;
      if (rawAudio > prev) {
        audioRef.current += (rawAudio - prev) * 0.35;
      } else {
        audioRef.current += (rawAudio - prev) * 0.08;
      }
      const vol = audioRef.current;

      const voiceSpeed = speedRef.current + vol * 3.5;
      tRef.current += 0.02 * voiceSpeed;
      const t = tRef.current;

      const curState = orbStateRef.current;
      const isSpeaking = curState === "speaking";
      const isListeningState = curState === "listening";

      const breathPhase = isListeningState ? Math.sin(performance.now() * resolvedTheme.breathRate) : 0;

      let spreadMul: number, sizeMul: number, alphaMul: number, cloudAmp: number;
      const ampBase = resolvedTheme.cloudAmpBase;
      if (isSpeaking) {
        spreadMul = 1 + vol * 1.5;
        sizeMul = 1 + vol * 1.8;
        alphaMul = 1 + vol * 1.0;
        cloudAmp = (1.3 * ampBase) + vol * 1.5;
      } else if (isListeningState) {
        spreadMul = 1 + breathPhase * 0.15;
        sizeMul = 1 + breathPhase * 0.1;
        alphaMul = 0.85 + breathPhase * 0.15;
        cloudAmp = (0.6 * ampBase) + breathPhase * 0.25;
      } else {
        spreadMul = 1 + vol * 1.0;
        sizeMul = 1 + vol * 1.4;
        alphaMul = 1 + vol * 0.75;
        cloudAmp = ampBase + vol * 0.65;
      }

      ctx.clearRect(0, 0, sz, sz);
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.clip();

      const bg = ctx.createRadialGradient(c, c, 0, c, c, R);
      bg.addColorStop(0, resolvedTheme.bg[0]);
      bg.addColorStop(0.5, resolvedTheme.bg[1]);
      bg.addColorStop(0.8, resolvedTheme.bg[2]);
      bg.addColorStop(1, resolvedTheme.bg[3]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, sz, sz);

      const cl = resolvedTheme.clouds;
      drawCloud(c + Math.sin(t * 0.2) * R * 0.04, c + Math.sin(t * 0.45) * R * 0.4 * cloudAmp, R * 1.0, cl[0] as [number,number,number], 0.8 + Math.sin(t * 0.45) * 0.15);
      drawCloud(c + Math.cos(t * 0.18) * R * 0.05, c + Math.sin(t * 0.5 + Math.PI) * R * 0.38 * cloudAmp, R * 0.95, cl[1] as [number,number,number], 0.75 + Math.sin(t * 0.38 + 1.2) * 0.15);
      drawCloud(c + Math.sin(t * 0.15 + 1) * R * 0.05, c + Math.sin(t * 0.42 + 2.1) * R * 0.38 * cloudAmp, R * 0.9, cl[2] as [number,number,number], 0.7 + Math.sin(t * 0.42 + 2.5) * 0.15);
      drawCloud(c + Math.cos(t * 0.16 + 2) * R * 0.04, c + Math.sin(t * 0.55 + 3.3) * R * 0.35 * cloudAmp, R * 0.75, cl[3] as [number,number,number], 0.65 + Math.sin(t * 0.52 + 3.8) * 0.12);
      drawCloud(c + Math.sin(t * 0.12) * R * 0.03, c + Math.sin(t * 0.48 + 1.5) * R * 0.36 * cloudAmp, R * 0.75, cl[4] as [number,number,number], 0.6 + Math.sin(t * 0.32 + 4.5) * 0.12);
      drawCloud(c + Math.cos(t * 0.2 + 3) * R * 0.05, c + Math.sin(t * 0.52 + 4) * R * 0.4 * cloudAmp, R * 0.7, cl[5] as [number,number,number], 0.5 + Math.sin(t * 0.48 + 5) * 0.12);

      const coreRgb = resolvedTheme.core;
      const coreBright: [number,number,number] = [Math.min(255, coreRgb[0]+20), Math.min(255, coreRgb[1]+20), Math.min(255, coreRgb[2]+20)];
      const coreDim: [number,number,number] = [Math.max(0, coreRgb[0]-30), Math.max(0, coreRgb[1]-30), coreRgb[2]];

      if (isSpeaking) {
        drawCloud(c + Math.sin(t*0.1)*R*0.02, c + Math.sin(t*0.35+1)*R*0.2, R*(0.6+vol*0.35), coreBright, (0.7+Math.sin(t*0.35+1)*0.15)+vol*0.3);
      } else if (isListeningState) {
        drawCloud(c + Math.sin(t*0.1)*R*0.02, c + Math.sin(t*0.35+1)*R*0.15, R*(0.45+breathPhase*0.15), coreDim, 0.55+breathPhase*0.25);
      } else {
        drawCloud(c + Math.sin(t*0.1)*R*0.02, c + Math.sin(t*0.35+1)*R*0.2, R*(0.55+vol*0.15), coreRgb as [number,number,number], (0.65+Math.sin(t*0.35+1)*0.15)+vol*0.2);
      }

      const cloudFlowX = (nx: number, ny: number) =>
        Math.sin(t * 0.2 + ny * 1.2) * 0.03 + Math.cos(t * 0.15 + nx) * 0.02;
      const cloudFlowY = (nx: number, ny: number) =>
        (Math.sin(t * 0.45 + nx * 2) * 0.22 +
        Math.sin(t * 0.52 + ny * 1.8 + Math.PI) * 0.18 +
        Math.cos(t * 0.38 + nx * ny * 2) * 0.1) * cloudAmp;

      const tintColors = resolvedTheme.tints as [number,number,number][];

      const clusterDistScale = isSpeaking ? 0.25 : 1.0;
      const clusterPositions = clusters.map((cl) => {
        const a = cl.angle + t * cl.driftSpeed;
        const dist = cl.dist * clusterDistScale;
        const bx = c + Math.cos(a) * dist * sz;
        const by = c + Math.sin(a) * dist * sz;
        const nx = (bx - c) / R;
        const ny = (by - c) / R;
        return {
          x: bx + cloudFlowX(nx, ny) * R,
          y: by + cloudFlowY(nx, ny) * R,
          spread: cl.spread * sz * spreadMul,
        };
      });

      const waveAngle = t * 0.3;
      const waveX = Math.cos(waveAngle);
      const waveY = Math.sin(waveAngle);

      for (const p of particles) {
        let px: number, py: number;

        if (p.clusterId >= 0) {
          const cl = clusterPositions[p.clusterId];
          const orbAngle = p.localAngle + t * p.orbitSpeed;
          const orbDist = p.localDist * cl.spread;
          px = cl.x + Math.cos(orbAngle) * orbDist;
          py = cl.y + Math.sin(orbAngle) * orbDist;
        } else {
          const a = p.localAngle + t * p.orbitSpeed;
          const freeDist = p.localDist * (isSpeaking ? 0.35 : 1.0);
          const bx = c + Math.cos(a) * freeDist * sz;
          const by = c + Math.sin(a) * freeDist * sz;
          const nx = (bx - c) / R;
          const ny = (by - c) / R;
          px = bx + cloudFlowX(nx, ny) * R;
          py = by + cloudFlowY(nx, ny) * R;
        }

        let speakingWaveBoost = 0;
        if (isSpeaking) {
          const nx = (px - c) / R;
          const ny = (py - c) / R;
          const displaceStr = 0.06 + vol * 0.14;
          for (let w = 0; w < 4; w++) {
            const angle = t * 0.5 + w * Math.PI / 2;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const dot = nx * cosA + ny * sinA;
            const waveVal = Math.sin(dot * 8 - t * 3 + w * 1.7);
            px += -sinA * waveVal * displaceStr * R;
            py += cosA * waveVal * displaceStr * R;
            speakingWaveBoost += Math.max(0, waveVal) * (0.2 + vol * 0.5);
          }
        }

        if (isListeningState) {
          const bdx = px - c;
          const bdy = py - c;
          const scale = 1 + breathPhase * 0.12;
          px = c + bdx * scale;
          py = c + bdy * scale;
        }

        const dx = px - c;
        const dy = py - c;
        const distSq = dx * dx + dy * dy;
        if (distSq > R * R * 0.88) continue;

        const edgeFade = 1 - Math.sqrt(distSq) / (R * 0.94);
        const clampedEdge = Math.max(0, Math.min(1, edgeFade));
        const baseFade = 0.3 + 0.7 * Math.sin(t * p.fadeFreq + p.fadePhase);
        const sparkle = 0.7 + 0.3 * Math.sin(t * p.sparkleFreq + p.sparklePhase);

        const normDx = dx / R;
        const normDy = dy / R;
        const waveDot = normDx * waveX + normDy * waveY;
        const waveBoost = Math.max(0, Math.sin(waveDot * 4 - t * 1.2)) * 0.35 + speakingWaveBoost;

        let alpha = Math.min(1, (p.maxAlpha * Math.max(0, baseFade) * sparkle * clampedEdge + waveBoost) * alphaMul);

        if (isListeningState) {
          alpha *= 0.85 + breathPhase * 0.15;
        }

        const alphaThreshold = isSpeaking ? 0.01 : 0.02;
        if (alpha < alphaThreshold) continue;

        const dotR = Math.max(0.4, p.r * sz * 0.5 * sizeMul);
        const [cr, cg, cb] = tintColors[p.tint];

        if (p.isStar) {
          const glowR = dotR * 3.5;
          const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
          glow.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.7})`);
          glow.addColorStop(0.3, `rgba(${cr},${cg},${cb},${alpha * 0.3})`);
          glow.addColorStop(0.7, `rgba(${cr},${cg},${cb},${alpha * 0.08})`);
          glow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2);
          ctx.beginPath();
          ctx.arc(px, py, dotR * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha * 1.2)})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();
        }
      }

      const hl = ctx.createRadialGradient(c * 0.42, c * 0.35, 0, c * 0.42, c * 0.35, R * 0.3);
      hl.addColorStop(0, "rgba(255,255,255,0.45)");
      hl.addColorStop(0.2, "rgba(255,255,255,0.15)");
      hl.addColorStop(0.5, "rgba(255,255,255,0.03)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hl;
      ctx.fillRect(0, 0, sz, sz);

      ctx.restore();

      ctx.beginPath();
      ctx.arc(c, c, R - 0.5, 0, Math.PI * 2);
      const rimGrad = ctx.createLinearGradient(0, 0, sz, sz);
      rimGrad.addColorStop(0, "rgba(255,255,255,0.5)");
      rimGrad.addColorStop(0.5, "rgba(255,255,255,0.2)");
      rimGrad.addColorStop(1, "rgba(255,255,255,0.35)");
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = 1;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sz, clusters, particles, resolvedTheme, audioLevelPropRef]);

  return (
    <div
      className={className}
      style={{
        width: sz,
        height: sz,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: sz,
          height: sz,
          borderRadius: "50%",
          filter: `drop-shadow(0 0 ${sz * 0.1}px ${resolvedTheme.glow}) drop-shadow(0 0 ${sz * 0.25}px ${resolvedTheme.glow.replace(/[\d.]+\)$/, "0.2)")})`,
        }}
      />
    </div>
  );
}

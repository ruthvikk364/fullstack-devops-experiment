export interface OrbTheme {
  bg: [string, string, string, string];
  clouds: [number, number, number][];
  core: [number, number, number];
  tints: [number, number, number][];
  glow: string;
  clusterCount: number;
  particlesPerCluster: [number, number];
  freeParticles: number;
  starChance: number;
  driftSpeedRange: [number, number];
  orbitSpeedRange: [number, number];
  breathRate: number;
  cloudAmpBase: number;
}

export const ORB_THEMES: Record<string, OrbTheme> = {
  sapphire: {
    bg: ["#141840", "#243060", "#3850a0", "#5878c8"],
    clouds: [[50,100,255], [80,60,255], [40,160,255], [100,80,255], [60,130,255], [30,200,255]],
    core: [160, 180, 255],
    tints: [[255,255,255], [180,200,255], [160,180,255], [200,180,255]],
    glow: "rgba(80,100,230,0.35)",
    clusterCount: 13,
    particlesPerCluster: [75, 110],
    freeParticles: 280,
    starChance: 0.08,
    driftSpeedRange: [0.06, 0.14],
    orbitSpeedRange: [0.15, 0.40],
    breathRate: 0.0025,
    cloudAmpBase: 1.1,
  },
  purple: {
    bg: ["#4a2060", "#5a3078", "#7a50a0", "#a070c8"],
    clouds: [[255,50,150], [160,30,255], [40,100,255], [255,30,255], [255,80,120], [50,200,255]],
    core: [255, 180, 255],
    tints: [[255,255,255], [255,180,220], [160,200,255], [210,180,255]],
    glow: "rgba(180,100,230,0.35)",
    clusterCount: 14,
    particlesPerCluster: [80, 110],
    freeParticles: 300,
    starChance: 0.08,
    driftSpeedRange: [0.06, 0.12],
    orbitSpeedRange: [0.15, 0.40],
    breathRate: 0.0025,
    cloudAmpBase: 1.0,
  },
};

import { Howl } from "howler";

// ─── Cinema Sound System ──────────────────────────────────────
// Lazy-loaded on first scene trigger. All sounds preloaded together.

let cinemaSounds: Record<string, Howl> | null = null;

const SOUND_DEFS: Record<string, { src: string; volume: number; loop?: boolean }> = {
  takeoff:    { src: "/audio/cinema/takeoff.mp3",     volume: 0.4 },
  flight:     { src: "/audio/cinema/flight-loop.mp3",  volume: 0.2, loop: true },
  shoot:      { src: "/audio/cinema/shoot.mp3",        volume: 0.3 },
  impact:     { src: "/audio/cinema/impact.mp3",       volume: 0.35 },
  shield_hit: { src: "/audio/cinema/shield-hit.mp3",   volume: 0.3 },
  explosion:  { src: "/audio/cinema/explosion.mp3",    volume: 0.4 },
  victory:    { src: "/audio/cinema/victory.mp3",      volume: 0.5 },
  defeat:     { src: "/audio/cinema/defeat.mp3",       volume: 0.4 },
  crash:      { src: "/audio/cinema/crash.mp3",        volume: 0.35 },
};

export function preloadCinemaAudio() {
  if (cinemaSounds) return;
  cinemaSounds = {};
  for (const [name, def] of Object.entries(SOUND_DEFS)) {
    cinemaSounds[name] = new Howl({
      src: [def.src],
      volume: def.volume,
      loop: def.loop ?? false,
      preload: true,
    });
  }
}

export function playSceneSound(name: string) {
  cinemaSounds?.[name]?.play();
}

export function stopSceneSound(name: string) {
  cinemaSounds?.[name]?.stop();
}

export function fadeOutSceneSound(name: string, duration = 1000) {
  const s = cinemaSounds?.[name];
  if (s && s.playing()) {
    s.fade(s.volume(), 0, duration);
    setTimeout(() => s.stop(), duration);
  }
}

export function stopAllSceneSounds() {
  if (!cinemaSounds) return;
  for (const s of Object.values(cinemaSounds)) {
    s.stop();
  }
}

export interface Track {
  id: string;
  title: string;
  src: string;
}

export const TRACKS: Track[] = [
  { id: "midnight-premiere", title: "Midnight Premiere", src: "/audio/midnight-premiere.mp3" },
  { id: "final-cut", title: "Final Cut", src: "/audio/final-cut.mp3" },
  { id: "creative-differences", title: "Creative Differences", src: "/audio/creative-differences.mp3" },
  { id: "production-rain", title: "Production Rain", src: "/audio/production-rain.mp3" },
];

export interface RadioState {
  volume: number;
  trackIndex: number;
  shuffle: boolean;
}

const STORAGE_KEY = "gc_radio";

const DEFAULT_STATE: RadioState = { volume: 0.15, trackIndex: 0, shuffle: false };

export function loadRadioState(): RadioState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveRadioState(state: Partial<RadioState>) {
  if (typeof window === "undefined") return;
  try {
    const current = loadRadioState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch {}
}

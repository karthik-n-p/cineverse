// ─── XP & Leveling System ───────────────────────────────────

// ─── Types ──────────────────────────────────────────────────

export interface XpTier {
  id: string;
  name: string;
  color: string;
  minLevel: number;
  maxLevel: number;
}

export interface XpRank {
  level: number;
  title: string;
  tier: XpTier;
}

export type XpSourceType =
  | "checkin"
  | "dailies"
  | "kudos_given"
  | "visit"
  | "fly"
  | "raid_win"
  | "raid_loss"
  | "raid_defend"
  | "achievement"
  | "kudos_received"
  | "referral"
  | "gift_sent"
  | "github"
  | "survey";

// ─── Constants ──────────────────────────────────────────────

export const XP_TIERS: XpTier[] = [
  { id: "indie_studio", name: "Indie Studio", color: "#4ade80", minLevel: 1, maxLevel: 4 },
  { id: "regional_cinema", name: "Regional Cinema", color: "#60a5fa", minLevel: 5, maxLevel: 8 },
  { id: "mainstream_studio", name: "Mainstream Studio", color: "#a78bfa", minLevel: 9, maxLevel: 13 },
  { id: "global_distributor", name: "Global Distributor", color: "#fbbf24", minLevel: 14, maxLevel: 18 },
  { id: "blockbuster", name: "Blockbuster", color: "#22d3ee", minLevel: 19, maxLevel: 23 },
  { id: "executive_producer", name: "Executive Producer", color: "#ffffff", minLevel: 24, maxLevel: 999 },
];

const RANK_TITLES: [number, string][] = [
  [1, "Extra"],
  [2, "Background Artist"],
  [3, "First Audition"],
  [4, "Script Doctor"],
  [5, "Screenplay Submission"],
  [6, "Casting Call"],
  [7, "Creative Differences"],
  [8, "Post-Production"],
  [9, "Premiered"],
  [10, "Standby Actor"],
  [11, "Reshoot"],
  [12, "Lead Actor"],
  [13, "Art Director"],
  [14, "Set Supervisor"],
  [15, "Supporting Role"],
  [16, "Star Cast"],
  [17, "Screenwriter"],
  [18, "Award Winner"],
  [19, "Renowned Director"],
  [20, "Master Cinematographer"],
  [21, "Cinema Legend"],
  [22, "Superstar"],
  [23, "Cultural Icon"],
  [24, "Studio Head"],
  [25, "Hall of Fame"],
];

export const XP_RANKS: XpRank[] = RANK_TITLES.map(([level, title]) => ({
  level,
  title,
  tier: XP_TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel)!,
}));

export const DAILY_XP_CAP = 150;

export const ENGAGEMENT_SOURCES: Set<XpSourceType> = new Set([
  "checkin",
  "dailies",
  "kudos_given",
  "visit",
  "fly",
]);

// ─── Formulas ───────────────────────────────────────────────

/** Cumulative XP required to reach a given level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(25 * Math.pow(level, 2.2));
}

/** XP needed to go from current level to next level. */
export function xpDeltaForLevel(level: number): number {
  return xpForLevel(level + 1) - xpForLevel(level);
}

/** Determine level from total XP (never below 1). */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}

/** Get tier for a given level. */
export function tierFromLevel(level: number): XpTier {
  for (let i = XP_TIERS.length - 1; i >= 0; i--) {
    if (level >= XP_TIERS[i].minLevel) return XP_TIERS[i];
  }
  return XP_TIERS[0];
}

/** Get rank info (title + tier) for a given level. */
export function rankFromLevel(level: number): XpRank {
  if (level >= 25) {
    return { level, title: "Legend", tier: XP_TIERS[5] };
  }
  const rank = XP_RANKS.find((r) => r.level === level);
  return rank ?? { level, title: "Hello World", tier: XP_TIERS[0] };
}

/** Progress within current level (0 to 1). */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const delta = next - current;
  if (delta <= 0) return 1;
  return Math.min(1, (xp - current) / delta);
}

// ─── GitHub XP (log scale) ──────────────────────────────────

export function calculateGithubXp(dev: {
  contributions: number;
  total_stars: number;
  public_repos: number;
  total_prs: number;
}): number {
  return (
    Math.floor(Math.log2(Math.max(dev.contributions, 1) + 1) * 15) +
    Math.floor(Math.log2(Math.max(dev.total_stars, 1) + 1) * 10) +
    Math.floor(Math.log2(Math.max(dev.public_repos, 1) + 1) * 5) +
    Math.floor(Math.log2(Math.max(dev.total_prs, 1) + 1) * 8)
  );
}

// ─── Achievement XP ─────────────────────────────────────────

const ACHIEVEMENT_XP: Record<string, number> = {
  bronze: 10,
  silver: 25,
  gold: 50,
  diamond: 100,
};

export function xpForAchievementTier(tier: string): number {
  return ACHIEVEMENT_XP[tier] ?? 0;
}

// ─── Shared zone & item constants ────────────────────────────
// Single source of truth — imported by Building3D, ShopClient, loadout API, ShopPreview

export const ZONE_ITEMS: Record<string, string[]> = {
  crown: ["flag", "helipad", "spire", "satellite_dish", "crown_item", "github_star"],
  roof: ["antenna_array", "rooftop_garden", "rooftop_fire", "pool_party"],
  aura: ["neon_trim", "spotlight", "hologram_ring", "lightning_aura", "neon_outline", "particle_aura"],
};

export const ZONE_LABELS: Record<string, string> = {
  crown: "Crown",
  roof: "Roof",
  aura: "Aura",
};

export const ITEM_NAMES: Record<string, string> = {
  flag: "Clapperboard",
  helipad: "VIP Helicopter",
  spire: "Water Tower Set",
  satellite_dish: "Remote Broadcast",
  crown_item: "Award Trophy",
  antenna_array: "Lighting Rig",
  rooftop_garden: "Studio Garden",
  rooftop_fire: "Action Set Piece",
  pool_party: "Wrap Party",
  neon_trim: "Neon Lighting",
  spotlight: "Premiere Spotlight",
  hologram_ring: "Visual Effects Ring",
  lightning_aura: "Hero Aura",
  custom_color: "Signature Style",
  billboard: "Movie Poster",
  led_banner: "Cinema Marquee",
  neon_outline: "Glow Outline",
  particle_aura: "Cinematic Glow",
  streak_freeze: "Box Office Shield",
  // Raid vehicles
  raid_helicopter: "Camera Helicopter",
  raid_drone: "Filming Drone",
  raid_rocket: "Stunt Rocket",
  // Raid tags
  tag_neon: "Neon Filter",
  tag_fire: "Vintage Filter",
  tag_gold: "Oscar Filter",
  // Raid boosters
  raid_boost_small: "Action Makeup",
  raid_boost_medium: "Hero Costume",
  raid_boost_large: "FX Explosives",
  white_rabbit: "White Rabbit",
  github_star: "Cine Star",
};

// Correct mapping: item_id → achievement that unlocks it (from migration 007 seed)
export const ACHIEVEMENT_ITEMS: Record<string, { achievement: string; label: string }> = {
  flag: { achievement: "first_take", label: "First Take (1+ movie credits)" },
  custom_color: { achievement: "dedicated", label: "Dedicated Artist (1,000+ movie credits)" },
  neon_trim: { achievement: "method_actor", label: "Method Actor (2,500+ movie credits)" },
  antenna_array: { achievement: "set_builder", label: "Set Builder (25+ films)" },
  rooftop_garden: { achievement: "set_architect", label: "Set Architect (75+ films)" },
  spotlight: { achievement: "rising_star", label: "Rising Star (100+ ratings)" },
  helipad: { achievement: "talent_scout", label: "Talent Scout (10+ referrals)" },
  white_rabbit: { achievement: "white_rabbit", label: "Found the White Rabbit" },
};

export const ITEM_EMOJIS: Record<string, string> = {
  flag: "🏁", helipad: "🚁", spire: "🪣", satellite_dish: "📡", crown_item: "👑",
  antenna_array: "☀️", rooftop_garden: "🌿", rooftop_fire: "🔥", pool_party: "🏊",
  neon_trim: "💡", spotlight: "🔦", hologram_ring: "💫", lightning_aura: "⚡",
  custom_color: "🎨", billboard: "📺", led_banner: "🪧",
  neon_outline: "🔮", particle_aura: "✨",
  streak_freeze: "🧊",
  // Raid
  raid_helicopter: "🚁",
  raid_drone: "🛸",
  raid_rocket: "🚀",
  tag_neon: "🌈",
  tag_fire: "🔥",
  tag_gold: "🥇",
  raid_boost_small: "🎨",
  raid_boost_medium: "🛡️",
  raid_boost_large: "💣",
  white_rabbit: "🐇",
  github_star: "⭐",
};

export const FACES_ITEMS = ["custom_color", "billboard", "led_banner"];

export const RAID_VEHICLE_ITEMS = ["raid_helicopter", "raid_drone", "raid_rocket"];
export const RAID_TAG_ITEMS = ["tag_neon", "tag_fire", "tag_gold"];
export const RAID_BOOST_ITEMS = ["raid_boost_small", "raid_boost_medium", "raid_boost_large"];

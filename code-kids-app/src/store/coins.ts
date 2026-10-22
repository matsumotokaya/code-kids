import type { Profile } from './progress';

/**
 * Coins a level is worth for its best star rating. Clearing pays most of it,
 * and the rest rewards coming back for ★3. Replays that do not improve the best rating pay nothing,
 * so the shop cannot be farmed by repeating stage 1.
 */
export const COINS_BY_STARS = [0, 30, 40, 50] as const;

export function levelCoins(stars: number): number {
  return COINS_BY_STARS[Math.max(0, Math.min(3, Math.floor(stars)))];
}

/** Coins newly paid out when a level's best rating goes from `prevStars` to `stars`. */
export function newCoins(prevStars: number, stars: number): number {
  return Math.max(0, levelCoins(stars) - levelCoins(prevStars));
}

export function profileCoins(profile: Profile | undefined): number {
  return Object.values(profile ?? {}).reduce((sum, r) => sum + levelCoins(r.stars), 0);
}

/**
 * The wallet is never stored: it is always "coins earned from the best results so far minus what was spent".
 * Stars won before coins existed therefore count too, and a lost or edited number cannot drift from the records.
 */
export function coinBalance(earned: number, purchases: Partial<Record<string, number>> | undefined): number {
  const spent = Object.values(purchases ?? {}).reduce<number>((sum, price) => sum + (price ?? 0), 0);
  return Math.max(0, earned - spent);
}

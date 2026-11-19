import type { FishTier } from '../types'

/**
 * Roster composition every water body is built around: ~70% common, ~20% rare,
 * ~10% legendary. Checked by `validateFishData`, so a rebalance cannot quietly
 * turn one water body into a legendary farm.
 */
export const TIER_SHARE: Record<FishTier, readonly [number, number]> = {
	common: [0.6, 0.8],
	rare: [0.1, 0.35],
	legendary: [0.04, 0.2]
}

/** Spawn weight band that matches each rarity class. */
export const TIER_WEIGHT: Record<FishTier, readonly [number, number]> = {
	common: [6, 24],
	rare: [2.5, 6.5],
	legendary: [0.6, 2]
}

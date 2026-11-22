import type { FishTier } from '../types'

/**
 * Roster composition every water body is built around: commons are the bulk of
 * the roster, mythics are one or two trophy species. Checked by
 * `validateFishData`, so a rebalance cannot quietly turn one water body into a
 * mythic farm.
 */
export const TIER_SHARE: Record<FishTier, readonly [number, number]> = {
	common: [0.34, 0.46],
	uncommon: [0.2, 0.35],
	rare: [0.14, 0.28],
	mythic: [0.04, 0.14]
}

/**
 * Spawn weights, per class: `base` outside the species' window, `bonus` inside.
 *
 * The weights are the whole balance table. A species always bites — `base` is
 * never zero — because a fish that can only be caught between 2 and 5 a.m. is a
 * wall in front of a player with a normal day; the window pays a 20× bonus for
 * the mythic band instead of locking it (`hasWindowBonus`).
 */
export const TIER_WEIGHTS: Record<FishTier, { readonly base: number; readonly bonus: number }> = {
	common: { base: 100, bonus: 100 },
	uncommon: { base: 15, bonus: 45 },
	rare: { base: 2, bonus: 15 },
	mythic: { base: 0.2, bonus: 4 }
}

/**
 * Share of normal fish catches that come up shiny, by class.
 *
 * A trophy is not meant to be collected at the same pace as a roach: the coat
 * is 0.4% on a common and 5% on a mythic. The luck zone doubles the roll, the
 * same way it lifts the rare end of the pool (`LUCK_ZONE_MULT`).
 */
export const TIER_SHINY: Record<FishTier, number> = {
	common: 0.004,
	uncommon: 0.01,
	rare: 0.015,
	mythic: 0.05
}

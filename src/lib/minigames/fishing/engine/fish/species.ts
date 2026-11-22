import type { AreaId, FishTier, TimeWindow, WeatherId } from '../types'

/** One catchable species. Every field is authored data, never rolled at runtime. */
export interface FishSpecies {
	id: string
	/** Russian display name. */
	name: string
	/** Physical weight range in kg; rolled per catch. */
	weightKg: readonly [number, number]
	/** Minigame difficulty knobs. */
	speed: number
	/** How hard the fish is to tire during the fight. */
	resistance: number
	tint: number
	/**
	 * Rarity class. The class, not the species, carries the spawn weights and the
	 * shiny odds (`TIER_WEIGHTS` / `TIER_SHINY` in `tiers.ts`), so a rebalance
	 * moves a whole band at once instead of forty hand-tuned numbers.
	 */
	tier: FishTier
	/** Area this fish belongs to. Every species lives in exactly one area. */
	area: AreaId
	/** Movement script key in `game/behaviors.ts` (defaults to the fish id). */
	behavior: string
	/** Time-of-day windows where this fish bites its bonus weight. Omitted = any time. */
	windows?: readonly TimeWindow[]
	/** Weather fronts where this fish bites its bonus weight. Omitted = any weather. */
	weather?: readonly WeatherId[]
}

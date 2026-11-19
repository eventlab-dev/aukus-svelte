import type { AreaId, FishTier, TimeWindow, WeatherId } from '../types'

/** One catchable species. Every field is authored data, never rolled at runtime. */
export interface FishSpecies {
	id: string
	/** Russian display name. */
	name: string
	/** Physical weight range in kg; rolled per catch. */
	weightKg: readonly [number, number]
	/**
	 * Relative spawn weight. The roster is tuned by rarity: common fish sit at
	 * 10–22, rare at 3–4.5 and legendary at 0.85–1, so a common bite is the norm
	 * and a legendary one is an event.
	 */
	weight: number
	/** Minigame difficulty knobs. */
	speed: number
	/** How hard the fish is to tire during the fight. */
	resistance: number
	tint: number
	tier: FishTier
	/** Area this fish belongs to. Every species lives in exactly one area. */
	area: AreaId
	/** Movement script key in `game/behaviors.ts` (defaults to the fish id). */
	behavior: string
	/** Time-of-day windows where this fish bites. Omitted = any time. */
	windows?: readonly TimeWindow[]
	/** Weather fronts where this fish bites. Omitted = any weather. */
	weather?: readonly WeatherId[]
}

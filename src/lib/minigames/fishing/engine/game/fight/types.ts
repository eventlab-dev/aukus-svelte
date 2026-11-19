export interface MinigameResult {
	won: boolean
}

export interface MinigameOptions {
	/** Where the bobber landed; the circle is built around this point. */
	anchor: { x: number; y: number }
	/**
	 * Weight of the catch in kg. Bigger fish inside the species range are pulled
	 * in slower, drain the angler's grip faster and spend less endurance; omitted
	 * means the neutral, mid-range fight.
	 */
	weightKg?: number
	/** Called when a strong dash is telegraphed. */
	onWarn?: () => void
	/** Called when the player lands a counter-pull. */
	onCounter?: () => void
	/** Called when the fish becomes landable. */
	onReady?: () => void
	/** Called when an early final pull makes the fish resist. */
	onResist?: () => void
	/** Called when the grip runs out. */
	onGripOut?: () => void
}

export interface Bubble {
	x: number
	y: number
	vx: number
	vy: number
	life: number
	maxLife: number
	size: number
}

/**
 * What the catch's weight does to the fight. Every value is 1 for a fish in the
 * middle of its species range, so a light and a heavy catch pull in opposite
 * directions around the same neutral fight.
 */
export interface WeightLoad {
	/** Multiplier on the angler's pull: below 1 the fish comes in slower. */
	pull: number
	/** Multiplier on the angler's grip drain while pulling. */
	grip: number
	/** Multiplier on the fish's endurance drain while it is being pulled. */
	tire: number
}

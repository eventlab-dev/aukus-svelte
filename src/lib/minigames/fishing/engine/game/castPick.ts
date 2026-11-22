import { LUCK_ZONE_MULT, type FishSpecies } from '../config'
import { fishInArea, hasGates, isAboveCommon, isFishInWindow } from '../fish'
import { TIER_WEIGHTS } from '../fish/tiers'
import type { AreaId, WeatherId } from '../types'
import { pickWeighted } from '../utils'

/** Catches on a water body before the pity multiplier starts to build. */
export const PITY_FROM = 100
/** Catches per pity step: every further twenty raises the weight once more. */
export const PITY_STEP = 20
/** How much one pity step multiplies the weight of a missing species. */
export const PITY_GROWTH = 1.5
/**
 * Ceiling of the pity multiplier.
 *
 * A missing species is the only thing that resets the counter, so the counter
 * never stops growing for it: uncapped, 400 catches on one water body make a
 * mythic 438 times heavier than authored and the rest of the pool stops
 * existing. Four is the point where the missed species dominates its own class
 * without taking the whole roll with it.
 */
export const PITY_MAX = 4

/**
 * Weight multiplier for a species the player has not landed yet.
 *
 * The counter is per water body, not per species: it measures how much the
 * player has already fished here. It applies inside and outside the window —
 * a pity that only helps the player who can be awake at 4 a.m. is not a pity.
 */
export function pityMultiplier(catchesOnLocation: number): number {
	if (!Number.isFinite(catchesOnLocation) || catchesOnLocation <= PITY_FROM) return 1
	const steps = Math.floor((catchesOnLocation - PITY_FROM) / PITY_STEP)
	return Math.min(PITY_GROWTH ** steps, PITY_MAX)
}

/** Everything that decides the next species: clock, weather, cast and codex. */
export interface CastPickContext {
	areaId: AreaId
	minutes: number
	weather: WeatherId
	/** True when the cast landed inside the luck zone. */
	luckZoneHit: boolean
	/** Landed fish on this water body; drives the pity multiplier. */
	catchesOnLocation: number
	/** Species ids the player has already landed; the rest enjoy the pity. */
	caught: ReadonlySet<string>
}

/**
 * Weight of one species in the current roll, before the pool is normalized.
 *
 * Split out of {@link pickCastFish} so the balance probe and any future tuning
 * table read the same numbers the game rolls: the window picks `bonus` or
 * `base`, the luck zone lifts every class above common *while it is in its
 * window*, and a missing species carries the pity multiplier.
 */
export function castWeight(fish: FishSpecies, context: CastPickContext): number {
	const weights = TIER_WEIGHTS[fish.tier]
	// A species with no gate at all never takes its bonus: it is available every
	// hour and in any sky, which is its whole point — see `hasGates`.
	const inWindow = hasGates(fish) && isFishInWindow(fish, context.minutes, context.weather)
	let weight = inWindow ? weights.bonus : weights.base
	if (inWindow && context.luckZoneHit && isAboveCommon(fish)) {
		weight *= LUCK_ZONE_MULT
	}
	if (!context.caught.has(fish.id)) {
		weight *= pityMultiplier(context.catchesOnLocation)
	}
	return weight
}

/**
 * Chooses the species for a bite.
 *
 * The roll is a weighted draw over the whole water body — nothing is filtered
 * out. A species in its window pays its `bonus` weight instead of `base`, the
 * luck zone tilts the rare classes by `LUCK_ZONE_MULT`, and every missing
 * species on the water body carries its pity multiplier. Cast distance
 * deliberately has no effect.
 */
export function pickCastFish(context: CastPickContext): FishSpecies {
	return pickWeighted(fishInArea(context.areaId), (fish) => castWeight(fish, context))
}

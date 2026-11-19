import { LUCK_ZONE_MULT, isRareFish, type FishSpecies } from '../config'
import { fishInArea, isFishActive } from '../fish'
import type { WeatherDef } from '../world'
import type { AreaId, WeatherId } from '../types'
import { pickWeighted } from '../utils'

/** Everything that biases the next bite: clock, weather and the luck zone. */
export interface CastPickContext {
	areaId: AreaId
	minutes: number
	weather: WeatherId
	weatherDef: WeatherDef
	/** True when the cast landed inside the luck zone. */
	luckZoneHit: boolean
}

/**
 * Chooses the fish for a bite. Active windows and weather narrow the roster
 * first; the roll is weighted by the weather front and a small luck-zone nudge
 * for rare fish. Cast distance deliberately has no effect.
 */
export function pickCastFish(context: CastPickContext): FishSpecies {
	const roster = fishInArea(context.areaId)
	const active = roster.filter((fish) => isFishActive(fish, context.minutes, context.weather))
	const always = roster.filter((fish) => !fish.windows?.length && !fish.weather?.length)
	const source = active.length > 0 ? active : always.length > 0 ? always : roster

	return pickWeighted(source, (fish) => {
		let weight = fish.weight

		if (isRareFish(fish)) {
			weight *= context.weatherDef.rare
			if (context.luckZoneHit) weight *= LUCK_ZONE_MULT
		} else {
			weight *= context.weatherDef.common
		}
		return weight
	})
}

import { FISH } from './roster'
import type { FishSpecies } from './species'

export { FISH } from './roster'
export type { FishSpecies } from './species'
export { TIER_SHARE, TIER_WEIGHT } from './tiers'
export { FISH_TEMPERAMENT, temperamentFor } from './temperament'
export { fishInArea, isFishActive, isRareFish, isWindowActive } from './activity'
export { fishDescription, fullWeatherLabel, fullWindowLabel, whenPhrase } from './labels'
export { fishText } from './text'
export { validateFishData } from './validate'

export const FISH_BY_ID: Record<string, FishSpecies> = Object.fromEntries(
	FISH.map((fish) => [fish.id, fish])
)

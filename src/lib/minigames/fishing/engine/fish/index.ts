import { FISH } from './roster'
import type { FishSpecies } from './species'

export { FISH } from './roster'
export type { FishSpecies } from './species'
export { TIER_SHARE, TIER_SHINY, TIER_WEIGHTS } from './tiers'
export { FISH_TEMPERAMENT, temperamentFor } from './temperament'
export { fishInArea, hasGates, isAboveCommon, isFishInWindow, isWindowActive } from './activity'
export { fishDescription, fullWeatherLabel, fullWindowLabel, whenPhrase } from './labels'
export { fishText } from './text'
export { validateFishData } from './validate'
export { isPlatinum, lowEnd } from './platinum'
export { SHELL_ID, SHELL_SPECIES, isShell } from './shell'
export {
	PEARLS,
	PEARL_BANDS,
	PEARL_BY_ID,
	PEARL_EDGES,
	formatFlaw,
	formatPearlSize,
	pearlBand,
	pearlDemoSpec,
	pearlScale,
	rollPearl
} from './pearls'
export type {
	PearlBand,
	PearlBandId,
	PearlCatch,
	PearlGrade,
	PearlId,
	PearlSpecies
} from './pearls'

export const FISH_BY_ID: Record<string, FishSpecies> = Object.fromEntries(
	FISH.map((fish) => [fish.id, fish])
)

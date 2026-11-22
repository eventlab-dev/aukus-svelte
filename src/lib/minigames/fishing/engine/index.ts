import { Game } from './Game'
import type { FishingGameInstance, FishingGameOptions } from './types'

/**
 * Creates and mounts the fishing game inside the given element.
 *
 * ```ts
 * const game = await createFishingGame({ container: document.getElementById("game")! });
 * // later
 * game.destroy();
 * ```
 */
export async function createFishingGame(options: FishingGameOptions): Promise<FishingGameInstance> {
	return Game.create(options)
}

export { Game } from './Game'
export { AREAS, AREA_BY_ID, DEFAULT_AREA_ID } from './areas'
export type { AreaDef, SceneLayout } from './areas'
export {
	FISH,
	FISH_BY_ID,
	PEARLS,
	PEARL_BANDS,
	PEARL_BY_ID,
	fishDescription,
	fishInArea,
	formatFlaw,
	formatPearlSize,
	isFishInWindow,
	pearlBand,
	pearlScale,
	whenPhrase
} from './fish'
export type {
	FishSpecies,
	PearlBand,
	PearlBandId,
	PearlCatch,
	PearlGrade,
	PearlId,
	PearlSpecies
} from './fish'
export {
	LocalProgressRepository,
	MemoryProgressRepository,
	ProgressTracker,
	createHttpProgressRepository,
	parseProgress
} from './progress'
export type {
	AreaId,
	AreaLocations,
	CatchEvent,
	FishingGameInstance,
	FishingGameOptions,
	FishProgress,
	FishTier,
	PearlCatchEvent,
	PearlProgress,
	PearlSpecimen,
	ProgressRepository,
	ProgressSnapshot,
	StartScreen,
	Temperament,
	TimeWindow,
	WaterKind
} from './types'

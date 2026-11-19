import type { FishSpecies } from './species'
import { LAKE_FISH } from './roster-lake'
import { RIVER_FISH } from './roster-river'
import { SEA_FISH } from './roster-sea'

/**
 * All 40 species, grouped by water type. The split is biological where it can
 * be (everything that only lives in salt water is in the sea) and leans on the
 * displayed name where the art pack is loose, e.g. the "Сомик" is a lake
 * bottom-dweller. Bearers that tolerate both fresh and salt water sit in the
 * river, which also doubles as its estuary: Шэд, Угорь, Осетр, Сибас,
 * Песковник, Креветка и Илистый прыгун.
 */
export const FISH: readonly FishSpecies[] = [...LAKE_FISH, ...RIVER_FISH, ...SEA_FISH]

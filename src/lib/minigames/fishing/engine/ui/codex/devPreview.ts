import { PLATINUM } from '../../config'
import { FISH_BY_ID, fishInArea, isPlatinum } from '../../fish'
import type { AreaId, FishProgress, ProgressSnapshot } from '../../types'

/**
 * Dev-only preview of a completed well.
 *
 * Reaching platinum honestly takes the class' tally of catches and both ends of
 * the weight — too long a loop to look at the plate shader. In a dev build, when
 * the document has no platinum entry at all, the first species of the tab the
 * codex opens on gets a synthetic finished record.
 *
 * The record is served through `CodexBase.fishEntry`, so the roster and the
 * entry card read the same numbers: the plate and the tally cannot disagree. The
 * coat is set only because a finished slot may wear one — it is not part of the
 * condition. Nothing is written back to storage, and the branch is dropped from
 * a production build.
 */
export function devPlatinumPreview(
	areaId: AreaId,
	snapshot: ProgressSnapshot
): { fishId: string; entry: FishProgress } | null {
	if (!import.meta.env.DEV) return null
	const alreadyPlatinum = Object.entries(snapshot.fish).some(([id, entry]) => {
		const species = FISH_BY_ID[id]
		return species !== undefined && isPlatinum(entry, species.tier)
	})
	if (alreadyPlatinum) return null
	const fish = fishInArea(areaId)[0]
	if (!fish) return null
	const [lightestKg, bestKg] = fish.weightKg
	return {
		fishId: fish.id,
		entry: {
			caught: PLATINUM.catches[fish.tier],
			bestKg,
			lightestKg,
			shiny: true
		}
	}
}

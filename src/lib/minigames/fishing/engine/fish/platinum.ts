import { PLATINUM } from '../config'
import type { FishProgress, FishTier } from '../types'

/**
 * Whether a species has earned its platinum frame.
 *
 * Two conditions, both about the species itself rather than about the
 * collection: a class-sized tally of catches and both ends of its weight (a
 * heaviest and a lightest specimen, not the same fish twice). The tally lives
 * on the class because the classes differ by two orders of magnitude in bite
 * rate; the frame is the one place the codex says "this entry is finished" —
 * the roster shows it as the only bright frame on the grid.
 *
 * The shiny coat is deliberately not a condition: a per-species rainbow is a
 * lottery whose tail is set by the rarest species (a koi coat is one catch in
 * twenty-five thousand), so requiring it makes the frame a matter of luck
 * rather than of work. The coat stays a collection mark of its own.
 */
export function isPlatinum(entry: FishProgress | undefined, tier: FishTier): boolean {
	if (!entry || entry.caught < PLATINUM.catches[tier]) return false
	return lowEnd(entry) < entry.bestKg
}

/** Lower end of the species record; a missing minimum means "never set". */
export function lowEnd(entry: FishProgress): number {
	return entry.lightestKg > 0 ? Math.min(entry.lightestKg, entry.bestKg) : entry.bestKg
}

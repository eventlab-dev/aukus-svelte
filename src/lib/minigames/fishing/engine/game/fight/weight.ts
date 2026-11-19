import { FIGHT, type FishSpecies } from '../../config'
import { clamp } from '../../utils'
import type { WeightLoad } from './types'

/**
 * Map a catch weight onto the fight. The weight matters *inside* the species
 * range and across species.
 *
 * Inside the range: a 100 g minnow at the top of its range and a 40 kg catfish
 * at its minimum both sit at the neutral 0, because species difficulty is
 * already carried by `resistance` and `speed`. That keeps a record-sized fish
 * of any species a better fight without turning small fish into trawling.
 *
 * Across species the catch's own mass is what the angler actually reels in, so
 * a mean species weight also scales the pull — gently, with a square root, so a
 * perch comes in a touch quicker than a pike and both come in much quicker than
 * a halibut, without turning the big fish into a tug-of-war.
 */
export function weightLoad(fish: FishSpecies, kg?: number): WeightLoad {
	const [min, max] = fish.weightKg
	const mean = (min + max) / 2
	/** Species mass: 1 for a fish of no weight, falling as the mean grows. */
	const mass = 1 / Math.sqrt(1 + Math.max(0, mean) * FIGHT.massPull)
	if (kg === undefined || !Number.isFinite(kg) || max <= min) {
		return { pull: mass, grip: 1, tire: 1 }
	}
	const t = clamp((kg - min) / (max - min), 0, 1)
	/** -1 at the lightest catch of the range, 0 mid, +1 at the heaviest. */
	const swing = t * 2 - 1
	return {
		pull: (1 - FIGHT.weightPull * swing) * mass,
		grip: 1 + FIGHT.weightGrip * swing,
		tire: 1 - FIGHT.weightTire * swing
	}
}

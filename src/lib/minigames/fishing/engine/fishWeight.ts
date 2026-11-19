import type { FishSpecies } from './config'
import { clamp, randRange } from './utils'

/** Roll a catch weight inside the species range, rounded to 10 g. */
export function rollFishWeight(fish: FishSpecies): number {
	const [min, max] = fish.weightKg
	return Math.round(randRange(min, max) * 100) / 100
}

/** Normalized position inside the species range, 0 at min and 1 at max. */
export function weightT(fish: FishSpecies, kg: number): number {
	const [min, max] = fish.weightKg
	if (max <= min) return 0.5
	return clamp((kg - min) / (max - min), 0, 1)
}

/** Subtle post-catch size difference; never used before the fish is landed. */
export function weightScale(fish: FishSpecies, kg: number): number {
	return 0.94 + 0.12 * weightT(fish, kg)
}

/** 0.10, 1.4, 12 — keeps the weight readable in the small UI. */
export function formatWeight(kg: number): string {
	if (kg < 1) return kg.toFixed(2)
	if (kg < 10) return kg.toFixed(1)
	return String(Math.round(kg))
}

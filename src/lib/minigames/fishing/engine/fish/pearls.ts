import { PEARL_BAND_LABEL, PEARL_TEXT } from '../texts'
import type { PearlSpecimen } from '../types'
import { clamp, pickWeighted, randRange } from '../utils'

export type { PearlSpecimen } from '../types'

/** One of the twelve varieties of the first pearl set. */
export type PearlId = keyof typeof PEARL_TEXT

/**
 * Shine class that drives the shader's extra effects. It is deliberately not a
 * second codex rarity: every pearl is legendary, and the grade only decides how
 * bright the body reads (4, 5) and whether it gets iridescent tongues (5).
 */
export type PearlGrade = 1 | 2 | 3 | 4 | 5

export interface PearlSpecies {
	id: PearlId
	name: string
	grade: PearlGrade
	/** Physical size range in millimetres; rolled per catch. */
	sizeMm: readonly [number, number]
	/** Relative spawn weight inside the pearl set. */
	weight: number
	/** Overtone seed range; omitted means the whole 0..1 range. */
	seedRange?: readonly [number, number]
}

/**
 * The twelve pearls. All twelve are legendary catches; weights stay close so a
 * hunter can actually complete the set, while the higher grades stay a little
 * rarer.
 */
export const PEARLS: readonly PearlSpecies[] = [
	{
		id: 'freshwater',
		name: PEARL_TEXT.freshwater.name,
		grade: 1,
		sizeMm: [4, 8],
		weight: 12
	},
	{ id: 'drop', name: PEARL_TEXT.drop.name, grade: 2, sizeMm: [7, 12], weight: 10 },
	{ id: 'mabe', name: PEARL_TEXT.mabe.name, grade: 2, sizeMm: [5, 10], weight: 10 },
	{
		id: 'baroque',
		name: PEARL_TEXT.baroque.name,
		grade: 2,
		sizeMm: [6, 12],
		weight: 10
	},
	{
		id: 'keshi',
		name: PEARL_TEXT.keshi.name,
		grade: 2,
		sizeMm: [3, 7],
		weight: 10
	},
	{
		id: 'akoya',
		name: PEARL_TEXT.akoya.name,
		grade: 3,
		sizeMm: [6, 10],
		weight: 9
	},
	{ id: 'ring', name: PEARL_TEXT.ring.name, grade: 3, sizeMm: [6, 11], weight: 9 },
	{
		id: 'golden',
		name: PEARL_TEXT.golden.name,
		grade: 4,
		sizeMm: [7, 12],
		weight: 8
	},
	{ id: 'conch', name: PEARL_TEXT.conch.name, grade: 4, sizeMm: [6, 11], weight: 8 },
	{
		id: 'southsea',
		name: PEARL_TEXT.southsea.name,
		grade: 5,
		sizeMm: [9, 15],
		weight: 6,
		seedRange: [0.35, 0.85]
	},
	{
		id: 'tahitian',
		name: PEARL_TEXT.tahitian.name,
		grade: 5,
		sizeMm: [8, 14],
		weight: 6,
		seedRange: [0.62, 0.86]
	},
	{
		id: 'flame',
		name: PEARL_TEXT.flame.name,
		grade: 5,
		sizeMm: [7, 12],
		weight: 6,
		seedRange: [0.86, 1]
	}
]

export const PEARL_BY_ID: Record<PearlId, PearlSpecies> = Object.fromEntries(
	PEARLS.map((pearl) => [pearl.id, pearl])
) as Record<PearlId, PearlSpecies>

/**
 * Band edges of the flaw index. The shader interpolates these exact numbers
 * into its source (see `PearlView`), so a band change here cannot leave the
 * picture behind the codex label.
 *
 * The curve is chalky on purpose — `1 − U^2.5` puts four pearls in five in the
 * ordinary band — so the bands are narrow where a hunter looks: a flawless
 * (`< 0.01`) pearl is one shell in 250.
 */
export const PEARL_EDGES = {
	chalky: 0.4,
	matte: 0.15,
	satin: 0.05,
	glossy: 0.01
} as const

export type PearlBandId = keyof typeof PEARL_BAND_LABEL

export interface PearlBand {
	id: PearlBandId
	/** Lowest flaw value that still belongs to the band. */
	min: number
	/** Upper bound, inclusive only for the chalky band. */
	max: number
	label: string
}

/** From the most defective to the flawless end. */
export const PEARL_BANDS: readonly PearlBand[] = [
	{ id: 'chalky', min: PEARL_EDGES.chalky, max: 1, label: PEARL_BAND_LABEL.chalky },
	{ id: 'matte', min: PEARL_EDGES.matte, max: PEARL_EDGES.chalky, label: PEARL_BAND_LABEL.matte },
	{ id: 'satin', min: PEARL_EDGES.satin, max: PEARL_EDGES.matte, label: PEARL_BAND_LABEL.satin },
	{ id: 'glossy', min: PEARL_EDGES.glossy, max: PEARL_EDGES.satin, label: PEARL_BAND_LABEL.glossy },
	{ id: 'mirror', min: 0, max: PEARL_EDGES.glossy, label: PEARL_BAND_LABEL.mirror }
]

/** The band a flaw index falls into; edges belong to the higher band. */
export function pearlBand(float: number): PearlBand {
	if (float >= PEARL_EDGES.chalky) return PEARL_BANDS[0]
	if (float >= PEARL_EDGES.matte) return PEARL_BANDS[1]
	if (float >= PEARL_EDGES.satin) return PEARL_BANDS[2]
	if (float >= PEARL_EDGES.glossy) return PEARL_BANDS[3]
	return PEARL_BANDS[4]
}

/** A rolled catch: the specimen plus the variety that gave it its colour. */
export interface PearlCatch extends PearlSpecimen {
	id: PearlId
	grade: PearlGrade
}

export interface PearlRollOptions {
	/** Forced flaw for the dev hook and tests. */
	float?: number
	/** A cast inside the luck band may keep the better of two flaws. */
	luckZoneHit?: boolean
}

/**
 * Rolls the flaw index with a bias towards the chalky end: a flawless pearl is
 * the exception the player hunts for. The luck zone gives a second roll and
 * keeps the lower (better) value, so a good cast is the skill path to a mirror.
 */
function rollFlaw(): number {
	return 1 - Math.pow(Math.random(), 2.5)
}

export function rollPearl(options: PearlRollOptions = {}): PearlCatch {
	const float =
		options.float !== undefined
			? clamp(options.float)
			: options.luckZoneHit
				? Math.min(rollFlaw(), rollFlaw())
				: rollFlaw()
	const species = pickWeighted(PEARLS, (pearl) => pearl.weight)
	const [seedMin, seedMax] = species.seedRange ?? [0, 1]
	const [sizeMin, sizeMax] = species.sizeMm
	return {
		id: species.id,
		grade: species.grade,
		float: Math.round(float * 10000) / 10000,
		seed: randRange(seedMin, seedMax),
		sizeMm: Math.round(randRange(sizeMin, sizeMax) * 10) / 10
	}
}

/** `0.0123` — the number hunters compare. */
export function formatFlaw(float: number): string {
	return float.toFixed(4)
}

/** `8.4` — millimetres, one decimal. */
export function formatPearlSize(sizeMm: number): string {
	return sizeMm.toFixed(1)
}

/**
 * World scale of a pearl from its size, for the 16 px sprites. The catch and
 * the codex portrait share it so a 6 mm pearl reads smaller than a 15 mm one
 * everywhere.
 */
export function pearlScale(sizeMm: number): number {
	return 0.825 + clamp((sizeMm - 3) / 12) * 0.9
}

/**
 * Dev-only stand-in for an uncaught entry: spreads the five bands across the
 * twelve wells so the codex shows every treatment without a save.
 */
export function pearlDemoSpec(index: number): PearlSpecimen {
	const floats = [0.8, 0.3, 0.1, 0.03, 0.004]
	const species = PEARLS[index % PEARLS.length]
	const [min, max] = species.sizeMm
	return {
		float: floats[index % floats.length],
		seed: 0.5,
		sizeMm: Math.round((min + (max - min) * 0.5) * 10) / 10
	}
}

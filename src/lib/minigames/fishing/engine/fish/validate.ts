import { AREA_BY_ID } from '../areas'
import { TEMPERAMENT_IDS, type FishTier, type TimeWindow } from '../types'
import { fishInArea } from './activity'
import { FISH } from './roster'
import type { FishSpecies } from './species'
import { FISH_TEMPERAMENT } from './temperament'
import { fishText } from './text'
import { TIER_SHARE, TIER_WEIGHT } from './tiers'

function windowLength(window: TimeWindow): number {
	const span = window.to - window.from
	return span > 0 ? span : span + 1440
}

/**
 * Data invariants used by the fight simulation and the dev boot. Returns a
 * list of human-readable problems; an empty array means the roster is sound.
 *
 * `hasStrongDash` also enforces the telegraph rule: every rare and legendary
 * fish has a counterable beat, and each water teaches it at least twice. Quiet
 * commons are intentional — their fight is the tug, not the read.
 */
export function validateFishData(
	hasBehavior?: (id: string) => boolean,
	hasStrongDash?: (id: string) => boolean
): string[] {
	const problems: string[] = []
	const ids = new Set<string>()

	for (const fish of FISH) {
		if (ids.has(fish.id)) problems.push(`duplicate fish id: ${fish.id}`)
		ids.add(fish.id)
		if (!(fish.area in AREA_BY_ID)) {
			problems.push(`${fish.id}: unknown area ${fish.area}`)
		}
		const text = fishText(fish.id)
		if (!text) problems.push(`${fish.id}: missing FISH_TEXT entry`)
		else if (!text.temper) problems.push(`${fish.id}: empty temper`)
		if (!TEMPERAMENT_IDS.includes(FISH_TEMPERAMENT[fish.id])) {
			problems.push(`${fish.id}: missing temperament`)
		}
		if (hasBehavior && !hasBehavior(fish.behavior)) {
			problems.push(`${fish.id}: missing behavior script ${fish.behavior}`)
		}
		const [minWeight, maxWeight] = TIER_WEIGHT[fish.tier]
		if (fish.weight < minWeight || fish.weight > maxWeight) {
			problems.push(
				`${fish.id}: ${fish.tier} weight ${fish.weight} outside ${minWeight}..${maxWeight}`
			)
		}
		if (fish.windows) {
			for (const window of fish.windows) {
				if (window.from < 0 || window.from >= 1440 || window.to < 0 || window.to >= 1440) {
					problems.push(`${fish.id}: window out of range`)
				}
				if (window.from === window.to) {
					problems.push(`${fish.id}: window must not be 24h`)
				}
				if (fish.tier === 'legendary' && windowLength(window) > 180) {
					problems.push(`${fish.id}: legendary window longer than 3 hours`)
				}
			}
		}
	}

	if (FISH.length !== 40) {
		problems.push(`expected 40 species, found ${FISH.length}`)
	}

	if (hasStrongDash) {
		for (const fish of FISH) {
			if (fish.tier !== 'common' && !hasStrongDash(fish.behavior)) {
				problems.push(`${fish.id}: ${fish.tier} fish has no telegraphed dash`)
			}
		}
	}

	for (const area of Object.values(AREA_BY_ID)) {
		const roster = fishInArea(area.id)
		if (roster.length === 0) problems.push(`${area.id}: empty roster`)
		if (hasStrongDash) {
			const strong = roster.filter((fish) => hasStrongDash(fish.behavior)).length
			if (strong < 2) {
				problems.push(`${area.id}: only ${strong} telegraphed dashes (min 2)`)
			}
		}
		const always = roster.filter(
			(fish: FishSpecies) =>
				(!fish.windows || fish.windows.length === 0) && (!fish.weather || fish.weather.length === 0)
		)
		if (always.length === 0) {
			problems.push(`${area.id}: no all-day fish`)
		}
		for (const tier of Object.keys(TIER_SHARE) as FishTier[]) {
			const count = roster.filter((fish) => fish.tier === tier).length
			const share = roster.length === 0 ? 0 : count / roster.length
			const [minShare, maxShare] = TIER_SHARE[tier]
			if (count === 0 || share < minShare || share > maxShare) {
				problems.push(
					`${area.id}: ${tier} share ${(share * 100).toFixed(0)}% (${count}/${roster.length}) outside ${minShare * 100}..${maxShare * 100}%`
				)
			}
		}
	}

	return problems
}

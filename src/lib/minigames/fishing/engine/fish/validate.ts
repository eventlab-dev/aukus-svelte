import { AREA_BY_ID } from '../areas'
import { TEMPERAMENT_IDS, type FishTier, type TimeWindow } from '../types'
import { WEATHER_IDS } from '../world/weather'
import { fishInArea } from './activity'
import { FISH } from './roster'
import { FISH_TEMPERAMENT } from './temperament'
import { fishText } from './text'
import { TIER_SHARE } from './tiers'

function windowLength(window: TimeWindow): number {
	const span = window.to - window.from
	return span > 0 ? span : span + 1440
}

/** A mythic is a narrow-window trophy: six hours at most. */
const MAX_MYTHIC_WINDOW = 360
/**
 * The fishing calendar is deliberately loose: weather is the main gate, the
 * player's real hours are only the seasoning. A fifth of the roster may keep a
 * time window; the rest bites on a sky or at any hour.
 */
const MAX_TIME_GATED = 10
/** Species that bite in any sky and at any hour: the floor of every session. */
const MIN_ALWAYS = 8
/** Every front has to be worth waiting for, or a sky becomes dead time. */
const MIN_PER_FRONT = 3

/**
 * Data invariants used by the fight simulation and the dev boot. Returns a
 * list of human-readable problems; an empty array means the roster is sound.
 *
 * `hasStrongDash` also enforces the telegraph rule: every rare and mythic fish
 * has a counterable beat, and each water teaches it at least twice. Quiet
 * commons and uncommons are intentional — their fight is the tug, not the read.
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
		const [minWeight, maxWeight] = fish.weightKg
		if (!(minWeight > 0) || maxWeight < minWeight) {
			problems.push(`${fish.id}: bad weight range ${minWeight}..${maxWeight}`)
		}
		if (fish.windows) {
			for (const window of fish.windows) {
				if (window.from < 0 || window.from >= 1440 || window.to < 0 || window.to >= 1440) {
					problems.push(`${fish.id}: window out of range`)
				}
				if (window.from === window.to) {
					problems.push(`${fish.id}: window must not be 24h`)
				}
				if (fish.tier === 'mythic' && windowLength(window) > MAX_MYTHIC_WINDOW) {
					problems.push(`${fish.id}: mythic window longer than 6 hours`)
				}
			}
		}
	}

	if (FISH.length !== 40) {
		problems.push(`expected 40 species, found ${FISH.length}`)
	}

	// The schedule itself: how much of the roster hangs on the player's real
	// hours, and whether every sky has something in it.
	const timed = FISH.filter((fish) => fish.windows && fish.windows.length > 0).length
	if (timed > MAX_TIME_GATED) {
		problems.push(`${timed} species are time-gated (max ${MAX_TIME_GATED})`)
	}
	const always = FISH.filter(
		(fish) =>
			(!fish.windows || fish.windows.length === 0) && (!fish.weather || fish.weather.length === 0)
	).length
	if (always < MIN_ALWAYS) {
		problems.push(`only ${always} species bite in any weather and hour (min ${MIN_ALWAYS})`)
	}
	for (const weather of WEATHER_IDS) {
		const count = FISH.filter((fish) => fish.weather?.includes(weather)).length
		if (count < MIN_PER_FRONT) {
			problems.push(`${weather}: only ${count} species bite in it (min ${MIN_PER_FRONT})`)
		}
	}

	if (hasStrongDash) {
		for (const fish of FISH) {
			if (fish.tier !== 'common' && fish.tier !== 'uncommon' && !hasStrongDash(fish.behavior)) {
				problems.push(`${fish.id}: ${fish.tier} fish has no telegraphed dash`)
			}
		}
	}

	for (const area of Object.values(AREA_BY_ID)) {
		const roster = fishInArea(area.id)
		if (roster.length === 0) {
			problems.push(`${area.id}: empty roster`)
			continue
		}
		if (hasStrongDash) {
			const strong = roster.filter((fish) => hasStrongDash(fish.behavior)).length
			if (strong < 2) {
				problems.push(`${area.id}: only ${strong} telegraphed dashes (min 2)`)
			}
		}
		for (const tier of Object.keys(TIER_SHARE) as FishTier[]) {
			const count = roster.filter((fish) => fish.tier === tier).length
			const share = count / roster.length
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

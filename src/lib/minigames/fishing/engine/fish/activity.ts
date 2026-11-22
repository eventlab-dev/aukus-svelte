import type { AreaId, TimeWindow, WeatherId } from '../types'
import { FISH } from './roster'
import type { FishSpecies } from './species'

/** True when `minutes` falls inside the window; handles midnight wrap. */
export function isWindowActive(window: TimeWindow, minutes: number): boolean {
	const m = ((minutes % 1440) + 1440) % 1440
	const from = ((window.from % 1440) + 1440) % 1440
	const to = ((window.to % 1440) + 1440) % 1440
	if (from === to) return true
	return from < to ? m >= from && m < to : m >= from || m < to
}

/**
 * True when the species has at least one gate: a time window or a sky.
 *
 * A species with no gates is available around the clock and in any weather —
 * but it also never takes its `bonus` weight (`castWeight`), because there is no
 * window for it to be in. Otherwise the eight fallback species would sit at
 * their bonus permanently and crowd out every gated fish in their class.
 */
export function hasGates(fish: FishSpecies): boolean {
	return Boolean(fish.windows?.length || fish.weather?.length)
}

/**
 * True when the fish is in its window and its weather right now.
 *
 * A window is no longer a filter, only a bonus: every species bites at its
 * `base` weight all day, and the window multiplies that weight to `bonus`. A
 * mythic that can only be caught between 2 and 5 a.m. is a wall in front of a
 * player with a normal day, and the codex would teach a schedule it does not
 * enforce.
 */
export function isFishInWindow(fish: FishSpecies, minutes: number, weather: WeatherId): boolean {
	const windowOk =
		!fish.windows ||
		fish.windows.length === 0 ||
		fish.windows.some((window) => isWindowActive(window, minutes))
	if (!windowOk) return false
	return !fish.weather || fish.weather.includes(weather)
}

/** True for any class above common: the one the luck zone and the chimes mark. */
export function isAboveCommon(fish: FishSpecies): boolean {
	return fish.tier !== 'common'
}

export function fishInArea(areaId: AreaId): readonly FishSpecies[] {
	return FISH.filter((fish) => fish.area === areaId)
}

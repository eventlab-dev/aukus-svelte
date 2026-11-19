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

/** A fish bites only inside one of its windows and only in its weather. */
export function isFishActive(fish: FishSpecies, minutes: number, weather: WeatherId): boolean {
	const windowOk =
		!fish.windows ||
		fish.windows.length === 0 ||
		fish.windows.some((window) => isWindowActive(window, minutes))
	if (!windowOk) return false
	return !fish.weather || fish.weather.includes(weather)
}

/** Rare and legendary fish get the weather/luck multipliers, common do not. */
export function isRareFish(fish: FishSpecies): boolean {
	return fish.tier !== 'common'
}

export function fishInArea(areaId: AreaId): readonly FishSpecies[] {
	return FISH.filter((fish) => fish.area === areaId)
}

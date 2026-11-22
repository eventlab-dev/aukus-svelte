import { WEATHER_CASE, WEATHER_LABEL } from '../texts'
import type { TimeWindow, WeatherId } from '../types'
import { formatClock } from '../utils'
import type { FishSpecies } from './species'
import { fishText } from './text'

/** `05:00–08:00 · 17:00–20:00`, or `КРУГЛОСУТОЧНО`. */
export function fullWindowLabel(fish: FishSpecies): string {
	if (!fish.windows || fish.windows.length === 0) return 'КРУГЛОСУТОЧНО'
	return fish.windows
		.map((window) => `${formatClock(window.from)}–${formatClock(window.to)}`)
		.join(' · ')
}

/** `ЯСНО, ОБЛАЧНО`, or `ЛЮБАЯ`. */
export function fullWeatherLabel(fish: FishSpecies): string {
	if (!fish.weather || fish.weather.length === 0) return 'ЛЮБАЯ'
	return fish.weather.map((id) => WEATHER_LABEL[id]).join(', ')
}

function windowPhrase(windows: readonly TimeWindow[]): string {
	if (windows.length === 1) {
		const window = windows[0]
		return `между ${formatClock(window.from)} и ${formatClock(window.to)}`
	}
	return windows
		.map((window) => `${formatClock(window.from)}–${formatClock(window.to)}`)
		.join(' и ')
}

function weatherPhrase(weather: readonly WeatherId[]): string {
	const bothCalm = weather.every((id) => id === 'clear' || id === 'overcast')
	if (weather.length > 1 && bothCalm) {
		const adjectives = weather.map((id) => (id === 'clear' ? 'ясную' : 'облачную'))
		return `в ${adjectives.join(' и ')} погоду`
	}
	return `в ${weather.map((id) => WEATHER_CASE[id]).join(' и ')}`
}

/**
 * `ловится всегда`, `активнее между 19:00 и 23:00`, `… в туман`.
 *
 * A window is a multiplier, not a lock (`isFishInWindow`), so the sentence
 * promises more bites, never exclusive ones: a species outside its window still
 * bites at its base weight.
 */
export function whenPhrase(fish: FishSpecies): string {
	const windows = fish.windows?.length ? fish.windows : null
	const weather = fish.weather?.length ? fish.weather : null
	if (!windows && !weather) return 'ловится всегда'
	if (windows && !weather) return `активнее ${windowPhrase(windows)}`
	if (!windows && weather) {
		return `выходит на кормежку ${weatherPhrase(weather)}`
	}
	if (windows && weather) {
		return `активнее ${windowPhrase(windows)} ${weatherPhrase(weather)}`
	}
	return 'ловится всегда'
}

/**
 * One-sentence codex blurb. The name and the water type are already printed
 * above the tooltip line, so the blurb starts with the habits instead of
 * repeating «Осетр — речная рыба»:
 * «Активнее между 00:00 и 03:00 в метель и туман, древняя, тяжелая и упорная.»
 */
export function fishDescription(fish: FishSpecies): string {
	const temper = fishText(fish.id)?.temper ?? 'с характером'
	return `${capitalizeFirst(whenPhrase(fish))}, ${temper}.`
}

function capitalizeFirst(value: string): string {
	return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1)
}

import type { WeatherId } from '../types'

/**
 * How long a weather front lasts, in real seconds: four to six minutes.
 *
 * A front used to turn over every 75–150 seconds, which made the sky — and the
 * forecast rail under it — feel like a slot machine while the player was still
 * reading the water. Four to six minutes is long enough to settle into a front,
 * plan a cast around it and see the rail's next period arrive, and still short
 * enough that a rare fish needing a storm shows up inside one sitting.
 */
export const WEATHER_MIN = 240
export const WEATHER_MAX = 360

/**
 * How many fronts the clock keeps rolled ahead of the live one. The rail shows
 * up to four *periods*, and a period can swallow several fronts when the sky
 * does not change, so the queue is deeper than the number of columns.
 */
export const FORECAST_QUEUE = 6

/** One column of the forecast: a front and when it takes over. */
export interface ForecastStep {
	weather: WeatherId
	/** Seconds from now until this front starts; 0 for the live one. */
	startsIn: number
	/** Seconds from now until the next front takes over. */
	endsIn: number
	/** Full length of this front, in seconds. */
	length: number
}

export interface WeatherDef {
	id: WeatherId
	/** Weight multiplier for rare fish. */
	rare: number
	/** Weight multiplier for common fish. */
	common: number
	/** 0..1 snowfall amount. */
	snow: number
	/** 0..1 wind gusts: the blizzard leans on it for its speed. */
	gust: number
	/** 0..1 fog amount. */
	fog: number
	/** Extra darkening on top of the time-of-day palette. */
	dark: number
	/**
	 * 0..1 cloud cover. Overcast weather throws drifting cloud shadows over the
	 * water; a clear sky has none, and a blizzard is too busy with snow to show
	 * them. Also drives the grey wash over the frame.
	 */
	cloud: number
}

/**
 * The five winter fronts. There is no rain and no thunderstorm: this is a
 * frozen lake in the middle of winter, so water only ever falls as snow, and
 * the heaviest weather is a blizzard, not a storm. A thunderstorm over a frozen
 * river was both wrong for the season and drowned the cast sounds.
 */
export const WEATHER: Record<WeatherId, WeatherDef> = {
	clear: {
		id: 'clear',
		rare: 0.9,
		common: 1.12,
		snow: 0,
		gust: 0,
		fog: 0,
		dark: 0,
		cloud: 0
	},
	overcast: {
		id: 'overcast',
		rare: 1,
		common: 1,
		snow: 0,
		gust: 0.14,
		fog: 0.08,
		// A flat grey lid is the whole point of the front: it has to read at a
		// glance against a bright clear sky, so it darkens the frame and slides
		// cloud shadows across the water.
		dark: 0.26,
		cloud: 0.9
	},
	snow: {
		id: 'snow',
		rare: 1.22,
		common: 0.92,
		snow: 0.65,
		gust: 0.22,
		fog: 0.12,
		dark: 0.18,
		cloud: 0.35
	},
	blizzard: {
		id: 'blizzard',
		rare: 1.5,
		common: 0.78,
		snow: 1,
		gust: 1,
		fog: 0.06,
		dark: 0.3,
		cloud: 0
	},
	fog: {
		id: 'fog',
		rare: 1.16,
		common: 1,
		snow: 0,
		gust: 0.04,
		fog: 1,
		dark: 0.06,
		cloud: 0.12
	}
}

export const WEATHER_IDS = Object.keys(WEATHER) as WeatherId[]

/** Weather does not jump at random: each front has likely successors. */
const TRANSITIONS: Record<WeatherId, Array<[WeatherId, number]>> = {
	clear: [
		['clear', 0.4],
		['overcast', 0.38],
		['fog', 0.12],
		['snow', 0.1]
	],
	overcast: [
		['overcast', 0.3],
		['clear', 0.25],
		['snow', 0.3],
		['fog', 0.15]
	],
	snow: [
		['snow', 0.34],
		['overcast', 0.3],
		['blizzard', 0.24],
		['clear', 0.12]
	],
	blizzard: [
		['blizzard', 0.4],
		['snow', 0.45],
		['overcast', 0.15]
	],
	fog: [
		['fog', 0.3],
		['clear', 0.3],
		['overcast', 0.4]
	]
}

export function pickWeather(current: WeatherId): WeatherId {
	const options = TRANSITIONS[current]
	let roll = Math.random()
	for (const [id, weight] of options) {
		roll -= weight
		if (roll <= 0) return id
	}
	return options[options.length - 1][0]
}

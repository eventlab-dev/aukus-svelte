import type { WeatherId } from '../types'

/**
 * How long a weather front lasts, in real seconds: eight to twelve minutes.
 *
 * A front used to turn over every 75–150 seconds, which made the sky — and the
 * forecast rail under it — feel like a slot machine while the player was still
 * reading the water. Four to six minutes fixed the slot machine but left the
 * sky changing four times while the player waited for a target front; eight to
 * twelve is long enough to settle into a front and still short enough that a
 * trophy needing a blizzard shows up inside one sitting. The rail draws a dozen
 * fronts ahead, so a run of one sky never hides what comes after it.
 */
export const WEATHER_MIN = 480
export const WEATHER_MAX = 720

/**
 * How many fronts the clock keeps rolled ahead of the live one: the rail's
 * scrolling horizon. A dozen fronts at eight to twelve minutes each is about
 * two hours of sky, which is deeper than any single session.
 */
export const FORECAST_QUEUE = 12

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
	/**
	 * 0..1 northern-lights intensity. Only the aurora front raises it; the
	 * atmosphere draws its ribbons from this number alone, so a front can carry
	 * a faint glow or a full curtain without a second table.
	 */
	aurora: number
}

/**
 * The winter fronts. There is no rain and no thunderstorm: this is a frozen
 * lake in the middle of winter, so water only ever falls as snow, and the
 * heaviest weather is a blizzard, not a storm. A thunderstorm over a frozen
 * river was both wrong for the season and drowned the cast sounds.
 *
 * The aurora is the sixth front and the only one that is gated by the clock:
 * it can only roll after dark (`isAuroraHour`), because ribbons over a noon
 * lake read as a bug rather than as a sky.
 */
export const WEATHER: Record<WeatherId, WeatherDef> = {
	clear: {
		id: 'clear',
		snow: 0,
		gust: 0,
		fog: 0,
		dark: 0,
		cloud: 0,
		aurora: 0
	},
	overcast: {
		id: 'overcast',
		snow: 0,
		gust: 0.14,
		fog: 0.08,
		// A flat grey lid is the whole point of the front: it has to read at a
		// glance against a bright clear sky, so it darkens the frame and slides
		// cloud shadows across the water.
		dark: 0.26,
		cloud: 0.9,
		aurora: 0
	},
	snow: {
		id: 'snow',
		snow: 0.65,
		gust: 0.22,
		fog: 0.12,
		dark: 0.18,
		cloud: 0.35,
		aurora: 0
	},
	blizzard: {
		id: 'blizzard',
		snow: 1,
		gust: 1,
		fog: 0.06,
		dark: 0.3,
		cloud: 0,
		aurora: 0
	},
	fog: {
		id: 'fog',
		snow: 0,
		gust: 0.04,
		fog: 1,
		dark: 0.06,
		cloud: 0.12,
		aurora: 0
	},
	aurora: {
		id: 'aurora',
		// A clear, still, freezing night: no flakes, almost no wind, and a dark
		// frame so the ribbons own it. The sliver of cloud keeps the sky from
		// reading as an empty flat fill behind them.
		snow: 0,
		gust: 0.05,
		fog: 0.04,
		dark: 0.5,
		cloud: 0.06,
		aurora: 1
	}
}

export const WEATHER_IDS = Object.keys(WEATHER) as WeatherId[]

/**
 * Warm half of the year aside, the aurora belongs to the night: 18:00–06:00,
 * wrapping midnight. The clock asks this before it keeps a rolled aurora, so a
 * night sky never takes over at noon.
 */
export function isAuroraHour(minutes: number): boolean {
	const m = ((minutes % 1440) + 1440) % 1440
	return m >= 1080 || m < 360
}

/** Weather does not jump at random: each front has likely successors. */
const TRANSITIONS: Record<WeatherId, Array<[WeatherId, number]>> = {
	clear: [
		['clear', 0.36],
		['overcast', 0.34],
		['fog', 0.1],
		['snow', 0.1],
		// The aurora is a clear-air sky: it only ever follows a clear or a light
		// grey night, never a snowfall that already hides the stars.
		['aurora', 0.1]
	],
	overcast: [
		['overcast', 0.28],
		['clear', 0.25],
		['snow', 0.3],
		['fog', 0.14],
		['aurora', 0.03]
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
		['clear', 0.28],
		['overcast', 0.4],
		['aurora', 0.02]
	],
	aurora: [
		['aurora', 0.35],
		['clear', 0.35],
		['overcast', 0.2],
		['snow', 0.1]
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

/**
 * The next front with the aurora rule applied: an aurora that would start in
 * daylight is re-rolled, and after a few tries the sky settles on overcast.
 *
 * The clock and the balance probe both go through this, so the sampled mix
 * cannot promise a night sky the game would never roll at noon.
 */
export function nextWeather(current: WeatherId, minutes: number): WeatherId {
	let id = pickWeather(current)
	for (let attempt = 0; attempt < 4 && id === 'aurora' && !isAuroraHour(minutes); attempt += 1) {
		id = pickWeather(current)
	}
	return id === 'aurora' && !isAuroraHour(minutes) ? 'overcast' : id
}

import { AREAS } from '../areas'
import type { SavedArea, SavedFront, WorldData, WorldStore } from '../storage'
import type { AreaId, WeatherId } from '../types'
import { formatClock, randRange } from '../utils'
import { paletteAt, type WorldPalette } from './colors'
import {
	FORECAST_QUEUE,
	WEATHER,
	WEATHER_MAX,
	WEATHER_MIN,
	pickWeather,
	type ForecastStep,
	type WeatherDef
} from './weather'

/** Minutes since midnight from the system clock, with sub-minute precision. */
function wallClockMinutes(): number {
	const now = new Date()
	return (
		now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60_000
	)
}

/**
 * Wall-clock seconds since the epoch. Every front is anchored to this, not to
 * a frame counter, so the sky keeps running while the tab is hidden, while the
 * player sits in a menu, and while the game is closed.
 */
function nowSeconds(): number {
	return Date.now() / 1000
}

/**
 * Weather ids this build used to save under the old summer names. The fronts
 * were renamed when the lake froze over, and a player who saved a "rain" front
 * should keep their sky rather than be reset to clear.
 */
const LEGACY_WEATHER: Record<string, WeatherId> = {
	rain: 'snow',
	storm: 'blizzard'
}

/** A saved front, translated to today's ids and validated against the table. */
function savedWeatherId(raw: unknown): WeatherId {
	if (typeof raw !== 'string') return 'clear'
	const weather = LEGACY_WEATHER[raw] ?? raw
	return weather in WEATHER ? (weather as WeatherId) : 'clear'
}

/** A saved length is trusted only while it still looks like a front. */
function isLength(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= WEATHER_MAX
}

/** One front on the wall clock: it starts and ends at absolute instants. */
interface Front {
	id: WeatherId
	/** Epoch seconds when the front took over. */
	startsAt: number
	/** Epoch seconds when the next front takes over. */
	endsAt: number
}

/** The sky over one water body: the live front and the promised ones. */
interface AreaWeather {
	current: Front
	queue: Front[]
}

/** A front as it goes to disk: its id, its absolute end and its full length. */
function saveFront(front: Front): SavedFront {
	return {
		id: front.id,
		endsAt: Math.round(front.endsAt * 1000) / 1000,
		length: Math.round((front.endsAt - front.startsAt) * 1000) / 1000
	}
}

/**
 * Persistent weather on top of a real-time clock. Every water body has its own
 * front; fronts advance independently and may well match. Both the time of day
 * and the weather schedule are read from the wall clock, so dawn, dusk, the
 * night bite and the fronts follow the real world instead of an accelerated
 * in-game day or the frame rate.
 *
 * The schedule itself — the live front, its absolute end and the queue the
 * forecast rail shows — is saved, so a reload resumes the same sky with the
 * time that really passed. On load the expired fronts are caught up along that
 * queue; an absence longer than the forecast simply rolls a fresh front.
 */
export class WorldClock {
	private readonly store: WorldStore
	private readonly areas: Record<AreaId, AreaWeather>
	/**
	 * Time of day pinned by the dev panel, in minutes since midnight, or
	 * null while the sky follows the wall clock. It is deliberately not saved:
	 * it is a viewing aid for a session, not a preference a player keeps.
	 */
	private timeOverride: number | null = null

	constructor(store: WorldStore) {
		this.store = store
		const saved = store.read()
		const now = nowSeconds()
		this.areas = {} as Record<AreaId, AreaWeather>
		for (const area of AREAS) {
			const state = this.restore(area.id, saved, now)
			// A save restored hours later has fronts that expired in the meantime:
			// catch the sky up before the first frame draws it.
			this.settle(state, now)
			this.fillQueue(state)
			this.areas[area.id] = state
		}
		// Writing here, not only on the first change, is what makes the rail's
		// promise survive a reload in the first minute of a fresh save.
		this.persist()
	}

	/** Rebuilds one area's schedule from a save, or starts a fresh front. */
	private restore(areaId: AreaId, saved: WorldData | null, now: number): AreaWeather {
		const area = saved?.areas?.[areaId]
		const current = area?.current
		const legacy = typeof saved?.weather === 'string' ? saved.weather : saved?.weather?.[areaId]
		const id = savedWeatherId(current?.id ?? legacy)
		if (!current || !isLength(current.length)) {
			const length = randRange(WEATHER_MIN, WEATHER_MAX)
			return {
				current: { id, startsAt: now, endsAt: now + length },
				queue: []
			}
		}
		// The absolute end is the anchor; the length says how much of the front is
		// left, and is what the rail reports. A save without a usable end starts
		// the front now instead of inventing a past.
		const endsAt = Number.isFinite(current.endsAt) ? current.endsAt : now
		const queue: Front[] = []
		let previous = endsAt
		for (const front of area?.queue ?? []) {
			if (!isLength(front.length)) continue
			queue.push({
				id: savedWeatherId(front.id),
				startsAt: previous,
				endsAt: previous + front.length
			})
			previous += front.length
		}
		return {
			current: { id, startsAt: endsAt - current.length, endsAt },
			queue
		}
	}

	/**
	 * Moves one area's sky up to `now`. Returns true when the front changed, so
	 * the caller can persist at once: a front that passed while the page was
	 * away must not be rolled again on the next reload.
	 */
	private settle(state: AreaWeather, now: number): boolean {
		const live = state.current
		if (now < live.startsAt) {
			// The wall clock moved back under the front (a manual change or a
			// timezone jump): slide the whole schedule back with it, so the live
			// front starts now and the queue keeps its spacing instead of waiting in
			// the future.
			const shift = now - live.startsAt
			live.startsAt = now
			live.endsAt += shift
			for (const front of state.queue) {
				front.startsAt += shift
				front.endsAt += shift
			}
			return true
		}
		if (now < live.endsAt) return false
		// The live front is over: adopt the earliest promised front still running.
		// Fronts that expired while the page was closed are dropped unread.
		while (state.queue.length > 0) {
			const next = state.queue.shift()
			if (!next) break
			if (now < next.endsAt) {
				state.current = next
				return true
			}
		}
		// The absence outlasted the forecast: roll from this moment rather than
		// replay hours of skies the player never saw.
		state.current = this.roll(state.current.id, now)
		return true
	}

	/** A fresh front that takes over at `at` and runs its own random length. */
	private roll(after: WeatherId, at: number): Front {
		const length = randRange(WEATHER_MIN, WEATHER_MAX)
		return { id: pickWeather(after), startsAt: at, endsAt: at + length }
	}

	/** Appends fronts to the promise until it covers the forecast rail. */
	private fillQueue(state: AreaWeather): void {
		while (state.queue.length < FORECAST_QUEUE) {
			const tail = state.queue[state.queue.length - 1] ?? state.current
			state.queue.push(this.roll(tail.id, tail.endsAt))
		}
	}

	get minutes(): number {
		return this.timeOverride ?? wallClockMinutes()
	}

	/**
	 * Pins the hour for the dev session, or hands the sky back to the wall clock
	 * with null. Everything that reads the time — the palette, the forecast rail,
	 * the bite windows — goes through {@link minutes}, so one pin moves all of
	 * them together and no screen can disagree with another about the hour.
	 */
	setTime(minutes: number | null): void {
		this.timeOverride = minutes === null ? null : ((minutes % 1440) + 1440) % 1440
	}

	/** The pinned minute, or null while the wall clock owns the hour. */
	get pinnedMinutes(): number | null {
		return this.timeOverride
	}

	get palette(): WorldPalette {
		return paletteAt(this.minutes)
	}

	weatherFor(areaId: AreaId): WeatherId {
		return this.areas[areaId].current.id
	}

	/**
	 * The fronts the player is about to get: the live one first, then the queued
	 * ones, each with the moment it starts and how long it runs. The rail draws
	 * this list, so it never has to guess or re-roll a front that will not come.
	 *
	 * Times come from the wall clock, not from a per-frame timer, so the rail's
	 * promise stays true even after the tab was hidden. A front that expired but
	 * has not been settled yet reports zero remaining and disappears on the next
	 * `update`.
	 */
	forecastFor(areaId: AreaId, count = FORECAST_QUEUE + 1): ForecastStep[] {
		const now = nowSeconds()
		const state = this.areas[areaId]
		const steps: ForecastStep[] = [
			{
				weather: state.current.id,
				startsIn: 0,
				endsIn: Math.max(0, state.current.endsAt - now),
				length: Math.max(1, state.current.endsAt - state.current.startsAt)
			}
		]
		for (const front of state.queue) {
			if (steps.length >= count) break
			const previous = steps[steps.length - 1]
			const length = Math.max(1, front.endsAt - front.startsAt)
			steps.push({
				weather: front.id,
				startsIn: previous.endsIn,
				endsIn: previous.endsIn + length,
				length
			})
		}
		return steps
	}

	weatherDefFor(areaId: AreaId): WeatherDef {
		return WEATHER[this.areas[areaId].current.id]
	}

	get label(): string {
		return formatClock(this.minutes)
	}

	/**
	 * Advances the weather fronts to the wall clock. The time of day needs no
	 * update: it is read from the system clock on demand. Returns true when at
	 * least one front changed, so the host can persist immediately.
	 */
	update(): boolean {
		const now = nowSeconds()
		let changed = false
		for (const area of AREAS) {
			const state = this.areas[area.id]
			if (!this.settle(state, now)) continue
			this.fillQueue(state)
			changed = true
		}
		return changed
	}

	persist(): void {
		const weather: Record<string, string> = {}
		const areas: Record<string, SavedArea> = {}
		for (const area of AREAS) {
			const state = this.areas[area.id]
			weather[area.id] = state.current.id
			areas[area.id] = {
				current: saveFront(state.current),
				queue: state.queue.map(saveFront)
			}
		}
		// Both shapes go to disk: `weather` is what a build without schedules
		// understands, `areas` is the schedule this one restores the rail from.
		this.store.write({ weather, areas })
	}

	/** Debug / preview hook; without an area it applies to every water body. */
	setWeather(weather: WeatherId, areaId?: AreaId): void {
		const now = nowSeconds()
		const targets = areaId ? AREAS.filter((area) => area.id === areaId) : AREAS
		for (const area of targets) {
			const length = randRange(WEATHER_MIN, WEATHER_MAX)
			const state: AreaWeather = {
				current: { id: weather, startsAt: now, endsAt: now + length },
				queue: []
			}
			this.fillQueue(state)
			this.areas[area.id] = state
		}
	}
}

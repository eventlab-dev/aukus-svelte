import { normalizeMix, type AudioMix } from './audioMix'

interface SettingsData {
	muted?: boolean
	/**
	 * Audio balance tuned in the dev panel. It only overrides the channels it
	 * names, so saving the mix into `audioMix.ts` still wins for the rest.
	 */
	mix?: Partial<AudioMix>
}

/** Device-local settings that should not travel with the player profile. */
export class SettingsStore {
	private readonly key: string
	private data: SettingsData

	constructor(prefix: string) {
		this.key = `${prefix}:settings:v1`
		this.data = this.read()
	}

	private read(): SettingsData {
		try {
			const raw = localStorage.getItem(this.key)
			if (!raw) return {}
			const parsed: unknown = JSON.parse(raw)
			if (!parsed || typeof parsed !== 'object') return {}
			const record = parsed as Record<string, unknown>
			const data: SettingsData = {}
			if (typeof record.muted === 'boolean') data.muted = record.muted
			const mix = normalizeMix(
				record.mix && typeof record.mix === 'object' ? (record.mix as Record<string, number>) : null
			)
			if (Object.keys(mix).length > 0) data.mix = mix
			return data
		} catch {
			return {}
		}
	}

	private write(): void {
		try {
			localStorage.setItem(this.key, JSON.stringify(this.data))
		} catch {
			// ignore
		}
	}

	get muted(): boolean | undefined {
		return this.data.muted
	}

	set muted(value: boolean) {
		this.data.muted = value
		this.write()
	}

	/** Dev-panel balance overrides, or `undefined` when the code values are used. */
	get mix(): Partial<AudioMix> | undefined {
		return this.data.mix
	}

	set mix(value: Partial<AudioMix> | null) {
		if (value) this.data.mix = normalizeMix(value)
		else delete this.data.mix
		this.write()
	}
}

/** One front as it is saved, anchored to the wall clock. */
export interface SavedFront {
	/** Weather id; the clock maps the legacy ids and rejects unknown ones. */
	id: string
	/** Epoch seconds when this front ends: the anchor the clock restores from. */
	endsAt: number
	/** Full length of the front, in seconds. */
	length: number
}

/** The sky over one water body: the live front and the ones queued behind it. */
export interface SavedArea {
	current: SavedFront
	queue: SavedFront[]
}

export interface WorldData {
	/**
	 * Weather ids, one per area. Older saves hold a single front as a plain
	 * string; the clock expands it to every area on load. This is also written
	 * next to {@link areas} so a build that predates schedules still finds its
	 * sky, and it is the fallback when a save carries no times.
	 */
	weather?: Record<string, string> | string
	/**
	 * Full per-area schedule: the live front with its absolute end and the
	 * forecast queue behind it. This is what makes the rail survive a reload.
	 */
	areas?: Record<string, SavedArea>
}

/** Deepest saved queue worth restoring; the clock rolls the rest anew. */
const MAX_SAVED_QUEUE = 12

function parseFront(raw: unknown): SavedFront | null {
	if (!raw || typeof raw !== 'object') return null
	const record = raw as Record<string, unknown>
	const { id, endsAt, length } = record
	if (typeof id !== 'string') return null
	if (typeof endsAt !== 'number' || !Number.isFinite(endsAt)) return null
	if (typeof length !== 'number' || !Number.isFinite(length) || length <= 0) {
		return null
	}
	return { id, endsAt, length }
}

function parseArea(raw: unknown): SavedArea | null {
	if (!raw || typeof raw !== 'object') return null
	const record = raw as Record<string, unknown>
	const current = parseFront(record.current)
	if (!current) return null
	const queue: SavedFront[] = []
	if (Array.isArray(record.queue)) {
		for (const item of record.queue.slice(0, MAX_SAVED_QUEUE)) {
			const front = parseFront(item)
			if (front) queue.push(front)
		}
	}
	return { current, queue }
}

function parseAreas(raw: unknown): Record<string, SavedArea> | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
	const areas: Record<string, SavedArea> = {}
	for (const [areaId, value] of Object.entries(raw)) {
		const area = parseArea(value)
		if (area) areas[areaId] = area
	}
	return areas
}

function parseWeather(raw: unknown): Record<string, string> | string | null {
	if (typeof raw === 'string') return raw
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
	const fronts: Record<string, string> = {}
	for (const [areaId, value] of Object.entries(raw)) {
		if (typeof value === 'string') fronts[areaId] = value
	}
	return fronts
}

/** Weather schedule of every water body, anchored to the wall clock. */
export class WorldStore {
	private readonly key: string

	constructor(prefix: string) {
		this.key = `${prefix}:world:v1`
	}

	read(): WorldData | null {
		try {
			const raw = localStorage.getItem(this.key)
			if (!raw) return null
			const parsed: unknown = JSON.parse(raw)
			if (!parsed || typeof parsed !== 'object') return null
			const record = parsed as Record<string, unknown>
			const data: WorldData = {}
			const weather = parseWeather(record.weather)
			if (weather) data.weather = weather
			const areas = parseAreas(record.areas)
			if (areas) data.areas = areas
			return data.areas || data.weather ? data : null
		} catch {
			return null
		}
	}

	write(data: WorldData): void {
		try {
			localStorage.setItem(this.key, JSON.stringify(data))
		} catch {
			// ignore
		}
	}
}

import { AREAS, DEFAULT_AREA_ID, isAreaId } from './areas'
import { FISH_BY_ID } from './fish'
import { PEARL_BY_ID, type PearlCatch } from './fish/pearls'
import { isHelpPageId, type HelpPageId } from './texts'
import type {
	AreaId,
	FishProgress,
	PearlProgress,
	PearlSpecimen,
	ProgressRepository,
	ProgressSnapshot
} from './types'

export const PROGRESS_VERSION = 6

/** Every water body at zero, so a counter can be read without a guard. */
function emptyAreaCatches(): Record<AreaId, number> {
	return Object.fromEntries(AREAS.map((area) => [area.id, 0])) as Record<AreaId, number>
}

/** Fresh document for a new player or when storage is unreadable. */
export function createEmptyProgress(): ProgressSnapshot {
	return {
		version: PROGRESS_VERSION,
		selectedArea: DEFAULT_AREA_ID,
		fish: {},
		pearls: {},
		areaCatches: emptyAreaCatches(),
		lessons: [],
		updatedAt: Date.now()
	}
}

function finiteNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseFishEntry(value: unknown): FishProgress | null {
	if (!value || typeof value !== 'object') return null
	const record = value as Record<string, unknown>
	const caught = finiteNumber(record.caught)
	if (caught === null) return null
	const best = Math.max(0, finiteNumber(record.bestKg) ?? 0)
	// A v3 document knew only the heaviest specimen. Its lightest becomes the
	// best it does know: the entry was already caught, and inventing a lower
	// number would hand the player a light record the catch never set.
	const stored = Math.max(0, finiteNumber(record.lightestKg) ?? best)
	return {
		caught: Math.max(0, Math.round(caught)),
		bestKg: best,
		lightestKg: stored > 0 ? Math.min(stored, best) : best,
		shiny: record.shiny === true
	}
}

function parsePearlSpecimen(value: unknown): PearlSpecimen | null {
	if (!value || typeof value !== 'object') return null
	const record = value as Record<string, unknown>
	const float = finiteNumber(record.float)
	const seed = finiteNumber(record.seed)
	const sizeMm = finiteNumber(record.sizeMm)
	if (float === null || seed === null || sizeMm === null) return null
	return {
		float: Math.min(1, Math.max(0, float)),
		seed: Math.min(1, Math.max(0, seed)),
		sizeMm: Math.min(50, Math.max(0, sizeMm))
	}
}

function parsePearlEntry(value: unknown): PearlProgress | null {
	if (!value || typeof value !== 'object') return null
	const record = value as Record<string, unknown>
	const caught = finiteNumber(record.caught)
	const best = parsePearlSpecimen(record.best)
	if (caught === null || caught <= 0 || !best) return null
	return { caught: Math.round(caught), best }
}

/** Reads the pity counter; null when the document predates it. */
function parseAreaCatches(value: unknown): Record<AreaId, number> | null {
	if (!value || typeof value !== 'object') return null
	const record = value as Record<string, unknown>
	const counts = emptyAreaCatches()
	let found = false
	for (const area of AREAS) {
		const count = finiteNumber(record[area.id])
		if (count === null || count <= 0) continue
		counts[area.id] = Math.round(count)
		found = true
	}
	return found ? counts : null
}

/**
 * Rebuilds the pity counter from the codex when the document has none.
 *
 * v6 introduced the counter, and the per-species tally is the only honest
 * source: a player with 120 roach and no mythic has fished that water body, and
 * starting them at zero would hide that from the pity.
 */
function deriveAreaCatches(fish: Record<string, FishProgress>): Record<AreaId, number> {
	const counts = emptyAreaCatches()
	for (const [id, entry] of Object.entries(fish)) {
		const species = FISH_BY_ID[id]
		if (species) counts[species.area] += entry.caught
	}
	return counts
}

/**
 * Normalizes anything that came back from a repository. Unknown species and
 * areas are dropped, malformed entries are ignored, and a missing document
 * becomes an empty one. This is the migration seam for future versions.
 */
export function parseProgress(raw: unknown): ProgressSnapshot {
	const snapshot = createEmptyProgress()
	if (!raw || typeof raw !== 'object') return snapshot

	const record = raw as Record<string, unknown>
	const version = finiteNumber(record.version)
	// This build drops the old visit/date fields; a v1 document is migrated to
	// the current shape instead of keeping its old version stamp.
	if (version !== null && version > PROGRESS_VERSION) {
		snapshot.version = version
	}
	if (isAreaId(record.selectedArea)) {
		snapshot.selectedArea = record.selectedArea
	}
	if (finiteNumber(record.updatedAt) !== null) {
		snapshot.updatedAt = finiteNumber(record.updatedAt) as number
	}

	if (record.fish && typeof record.fish === 'object') {
		for (const [id, value] of Object.entries(record.fish)) {
			if (!(id in FISH_BY_ID)) continue
			const entry = parseFishEntry(value)
			if (entry) snapshot.fish[id] = entry
		}
	}

	if (record.pearls && typeof record.pearls === 'object') {
		for (const [id, value] of Object.entries(record.pearls)) {
			if (!(id in PEARL_BY_ID)) continue
			const entry = parsePearlEntry(value)
			if (entry) snapshot.pearls[id] = entry
		}
	}

	// v6 counts the pity per water body. An older document knows only the
	// per-species tally, so the counter is rebuilt from the codex.
	snapshot.areaCatches = parseAreaCatches(record.areaCatches) ?? deriveAreaCatches(snapshot.fish)

	// A lesson is shown once. An id this build does not know is dropped, so a
	// renamed or retired page cannot silently keep a note from being read.
	if (Array.isArray(record.lessons)) {
		for (const lesson of record.lessons) {
			if (isHelpPageId(lesson) && !snapshot.lessons.includes(lesson)) {
				snapshot.lessons.push(lesson)
			}
		}
	}

	return snapshot
}

function clone(snapshot: ProgressSnapshot): ProgressSnapshot {
	return JSON.parse(JSON.stringify(snapshot)) as ProgressSnapshot
}

/** localStorage-backed repository. This is the default. */
export class LocalProgressRepository implements ProgressRepository {
	private readonly key: string

	constructor(prefix: string) {
		this.key = `${prefix}:progress:v1`
	}

	async load(): Promise<unknown> {
		try {
			const raw = localStorage.getItem(this.key)
			if (!raw) return null
			return JSON.parse(raw) as unknown
		} catch {
			return null
		}
	}

	async save(snapshot: ProgressSnapshot): Promise<void> {
		try {
			localStorage.setItem(this.key, JSON.stringify(snapshot))
		} catch {
			// Quota/private mode: the game keeps the document in memory.
		}
	}
}

/** Never-failing repository; useful for tests and restricted environments. */
export class MemoryProgressRepository implements ProgressRepository {
	private data: unknown = null

	async load(): Promise<unknown> {
		return this.data
	}

	async save(snapshot: ProgressSnapshot): Promise<void> {
		this.data = clone(snapshot)
	}
}

export interface HttpProgressRepositoryOptions {
	/** GET endpoint returning a ProgressSnapshot (or null). */
	loadUrl: string
	/** PUT endpoint accepting a ProgressSnapshot as JSON. */
	saveUrl: string
	headers?: Record<string, string>
	credentials?: RequestCredentials
}

/**
 * Ready-to-use adapter for a DB-backed API. The server contract is exactly the
 * JSON shape of {@link ProgressSnapshot}; auth is passed through `headers`.
 */
export function createHttpProgressRepository(
	options: HttpProgressRepositoryOptions
): ProgressRepository {
	const headers = {
		'Content-Type': 'application/json',
		...options.headers
	}
	return {
		async load(): Promise<unknown> {
			const response = await fetch(options.loadUrl, {
				method: 'GET',
				headers,
				credentials: options.credentials
			})
			if (!response.ok) {
				throw new Error(`[fishing] progress load failed: ${response.status}`)
			}
			const text = await response.text()
			return text.length > 0 ? (JSON.parse(text) as unknown) : null
		},
		async save(snapshot: ProgressSnapshot): Promise<void> {
			const response = await fetch(options.saveUrl, {
				method: 'PUT',
				headers,
				credentials: options.credentials,
				body: JSON.stringify(snapshot)
			})
			if (!response.ok) {
				throw new Error(`[fishing] progress save failed: ${response.status}`)
			}
		}
	}
}

/** A pearl is better when it is cleaner; size only breaks the tie. */
function isBetterPearl(next: PearlSpecimen, current: PearlSpecimen): boolean {
	if (next.float !== current.float) return next.float < current.float
	return next.sizeMm > current.sizeMm
}

const SAVE_DEBOUNCE_MS = 500
const RETRY_MS = 3000

/**
 * Owns the in-memory progress document and persists it through a repository.
 * Reads are synchronous for the UI; writes are debounced and serialized, so a
 * DB adapter never sees overlapping saves.
 */
export class ProgressTracker {
	private current: ProgressSnapshot
	private readonly repository: ProgressRepository
	private timer: ReturnType<typeof setTimeout> | null = null
	private retryTimer: ReturnType<typeof setTimeout> | null = null
	private saving: Promise<void> = Promise.resolve()
	private dirty = false

	/** Called on every mutation with the live snapshot. */
	onChange?: (snapshot: ProgressSnapshot) => void

	constructor(repository: ProgressRepository, initial: ProgressSnapshot) {
		this.repository = repository
		this.current = initial
	}

	get snapshot(): ProgressSnapshot {
		return this.current
	}

	/**
	 * Records a landed fish. True when this species had never been caught before.
	 *
	 * The water body comes in because the pity counter is per water body: the
	 * species id alone does not say where the catch happened, and the count feeds
	 * the next roll (`pityMultiplier`).
	 */
	recordCatch(areaId: AreaId, fishId: string, weightKg: number, shiny = false): boolean {
		const previous = this.current.fish[fishId]
		const firstCatch = previous === undefined || previous.caught <= 0
		const entry: FishProgress = previous
			? {
					caught: previous.caught + 1,
					bestKg: Math.max(previous.bestKg, weightKg),
					// A zero lightest is an empty field, not a 0 kg fish: take the
					// catch as the first known bottom instead of pinning the record to 0.
					lightestKg: previous.lightestKg > 0 ? Math.min(previous.lightestKg, weightKg) : weightKg,
					// Once seen, the colourway stays on the record: the codex keeps
					// showing the shiny specimen for the species, not the last catch.
					shiny: previous.shiny || shiny
				}
			: { caught: 1, bestKg: weightKg, lightestKg: weightKg, shiny }
		this.current.fish[fishId] = entry
		this.current.areaCatches[areaId] = (this.current.areaCatches[areaId] ?? 0) + 1
		this.touch()
		return firstCatch
	}

	/** True when this pearl variety had never been found before. */
	recordPearl(pearl: PearlCatch): boolean {
		const previous = this.current.pearls[pearl.id]
		const firstFind = previous === undefined || previous.caught <= 0
		const specimen: PearlSpecimen = {
			float: pearl.float,
			seed: pearl.seed,
			sizeMm: pearl.sizeMm
		}
		// Best = the cleanest pearl; size only breaks a tie, so two specimens with
		// the same flaw do not overwrite each other just because one was larger.
		const best = previous && !isBetterPearl(specimen, previous.best) ? previous.best : specimen
		this.current.pearls[pearl.id] = {
			caught: (previous?.caught ?? 0) + 1,
			best
		}
		this.touch()
		return firstFind
	}

	setArea(areaId: AreaId): void {
		if (this.current.selectedArea === areaId) return
		this.current.selectedArea = areaId
		this.touch()
	}

	/** True once the note for this mechanic has already been shown. */
	lessonSeen(lesson: HelpPageId): boolean {
		return this.current.lessons.includes(lesson)
	}

	/**
	 * Remembers that a lesson has been shown, so a reload does not bring it back.
	 *
	 * Saved at once instead of on the usual debounce: the note is read for far
	 * longer than 500 ms, but a player who reloads right after closing it must
	 * still find it gone.
	 */
	markLessonSeen(lesson: HelpPageId): void {
		if (this.current.lessons.includes(lesson)) return
		this.current.lessons.push(lesson)
		this.touch()
		void this.flush()
	}

	private touch(): void {
		this.current.updatedAt = Date.now()
		this.dirty = true
		this.schedule()
		this.onChange?.(this.current)
	}

	private schedule(): void {
		if (this.timer !== null) clearTimeout(this.timer)
		this.timer = setTimeout(() => {
			this.timer = null
			void this.flush()
		}, SAVE_DEBOUNCE_MS)
	}

	/** Persists the latest snapshot. Safe to await from host code. */
	flush(): Promise<void> {
		if (this.timer !== null) {
			clearTimeout(this.timer)
			this.timer = null
		}
		if (!this.dirty) return this.saving

		this.dirty = false
		const payload = clone(this.current)
		this.saving = this.saving.then(async () => {
			try {
				await this.repository.save(payload)
			} catch (error) {
				console.warn('[fishing] progress save failed', error)
				this.dirty = true
				this.scheduleRetry()
			}
		})
		return this.saving
	}

	private scheduleRetry(): void {
		if (this.retryTimer !== null) return
		this.retryTimer = setTimeout(() => {
			this.retryTimer = null
			void this.flush()
		}, RETRY_MS)
	}

	dispose(): void {
		if (this.timer !== null) {
			clearTimeout(this.timer)
			this.timer = null
		}
		if (this.retryTimer !== null) {
			clearTimeout(this.retryTimer)
			this.retryTimer = null
		}
	}
}

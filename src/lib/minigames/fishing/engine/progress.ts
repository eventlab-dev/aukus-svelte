import { DEFAULT_AREA_ID, isAreaId } from './areas'
import { FISH_BY_ID } from './fish'
import type { AreaId, FishProgress, ProgressRepository, ProgressSnapshot } from './types'

export const PROGRESS_VERSION = 2

/** Fresh document for a new player or when storage is unreadable. */
export function createEmptyProgress(): ProgressSnapshot {
	return {
		version: PROGRESS_VERSION,
		selectedArea: DEFAULT_AREA_ID,
		fish: {},
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
	return {
		caught: Math.max(0, Math.round(caught)),
		bestKg: Math.max(0, finiteNumber(record.bestKg) ?? 0)
	}
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

	/** True when this fish had never been caught before. */
	recordCatch(fishId: string, weightKg: number): boolean {
		const previous = this.current.fish[fishId]
		const firstCatch = previous === undefined || previous.caught <= 0
		const entry: FishProgress = previous
			? {
					caught: previous.caught + 1,
					bestKg: Math.max(previous.bestKg, weightKg)
				}
			: { caught: 1, bestKg: weightKg }
		this.current.fish[fishId] = entry
		this.touch()
		return firstCatch
	}

	setArea(areaId: AreaId): void {
		if (this.current.selectedArea === areaId) return
		this.current.selectedArea = areaId
		this.touch()
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

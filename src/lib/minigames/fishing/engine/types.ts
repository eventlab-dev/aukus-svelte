import type { Application } from 'pixi.js'

export type WeatherId = 'clear' | 'overcast' | 'snow' | 'blizzard' | 'fog' | 'aurora'

/**
 * Fixed personality of a species. The temperament is authored per fish instead
 * of rolled per fight, so the codex can teach the player what to expect.
 */
export type Temperament = 'calm' | 'aggressive' | 'skittish' | 'stubborn'

export const TEMPERAMENT_IDS: readonly Temperament[] = [
	'calm',
	'aggressive',
	'skittish',
	'stubborn'
]

/**
 * Water body ids. The ids are historical (they name the bank each scene was
 * built for) and are kept so persisted progress and the ambience map stay
 * valid. Every id is exactly one water type:
 *
 * - `deep`  — the lake (`WaterKind` "lake");
 * - `rapids`— the river ("river");
 * - `cove`  — the sea bay ("sea").
 */
export type AreaId = 'cove' | 'deep' | 'rapids'

/** The three kinds of water the fish are divided into. */
export type WaterKind = 'lake' | 'sea' | 'river'

/**
 * Rarity class of a species. All four classes share one weight matrix
 * (`TIER_WEIGHTS` in `fish/tiers.ts`): commons are the bulk of every pool and
 * mythics are the narrow-window trophies a codex is built around.
 */
export type FishTier = 'common' | 'uncommon' | 'rare' | 'mythic'

/** In-game minutes from midnight; `from` inclusive, `to` exclusive. */
export interface TimeWindow {
	from: number
	to: number
}

/** One rolled pearl, without the variety that gave it its colour. */
export interface PearlSpecimen {
	/** Flaw index, 0 (flawless) .. 1 (chalky). */
	float: number
	/** Overtone seed, 0..1. */
	seed: number
	/** Physical size in millimetres. */
	sizeMm: number
}

/** The pearl payload of a shell catch. */
export interface PearlCatchEvent extends PearlSpecimen {
	pearlId: string
	/** Shine class that drove the shader, 1..5. */
	grade: number
	/** True the first time this variety was ever found. */
	firstFind: boolean
}

/** Fired on every landed catch, after the progress record is updated. */
export interface CatchEvent {
	/** A fish keeps the old fields; a shell adds the pearl payload. */
	kind: 'fish' | 'shell'
	fishId: string
	areaId: AreaId
	weightKg: number
	firstCatch: boolean
	/** True when the landed fish wore the shiny colourway. Never for a shell. */
	shiny: boolean
	at: number
	/** Present exactly when `kind` is `shell`. */
	pearl?: PearlCatchEvent
}

export interface FishProgress {
	/** Total catches of this species. */
	caught: number
	/** Heaviest landed specimen, kg. */
	bestKg: number
	/**
	 * Lightest landed specimen, kg. The other end of the record: the codex marks
	 * the two extremes of the whole collection, and a light record needs a
	 * minimum as much as a heavy one needs a maximum.
	 */
	lightestKg: number
	/** True once a shiny specimen of this species has been landed. */
	shiny: boolean
}

export interface PearlProgress {
	/** Total catches of this pearl variety. */
	caught: number
	/** Best specimen: lowest flaw, then largest size. */
	best: PearlSpecimen
}

/**
 * One serializable document with all player progress. It is intentionally a
 * plain JSON object: an HTTP/DB adapter can PUT it verbatim and load it back
 * with `parseProgress`.
 */
export interface ProgressSnapshot {
	version: number
	selectedArea: AreaId
	fish: Record<string, FishProgress>
	/** Found pearl varieties, keyed by pearl id. */
	pearls: Record<string, PearlProgress>
	/**
	 * Landed fish per water body — the pity counter. A water body that keeps
	 * handing out the same species slowly raises the weight of the ones still
	 * missing from its codex. Shells do not count: a pearl is not a species.
	 */
	areaCatches: Record<AreaId, number>
	/**
	 * Manual pages the player has already been shown, in the order they came up.
	 *
	 * The round opens each mechanic's note once per document: without this list
	 * a reload brought every lesson back. Ids are `HelpPageId` values from
	 * `texts.ts`, kept as plain strings because this document is a host API.
	 */
	lessons: string[]
	updatedAt: number
}

/**
 * Persistence seam for progress. Implement this with fetch/localStorage/IndexedDB
 * and pass it as `progress` to the game. Both methods may reject; the game keeps
 * playing and retries the save on the next flush.
 */
export interface ProgressRepository {
	load(): Promise<unknown>
	save(snapshot: ProgressSnapshot): Promise<void>
}

/**
 * Availability of the water bodies, keyed by area id. A `false` blocks that
 * location: the picker shows the card closed and the round cannot travel
 * there. Everything that is not listed stays open, so the host only has to
 * name what it wants to keep shut.
 */
export type AreaLocations = Partial<Record<AreaId, boolean>>

export type StartScreen = 'menu' | 'game'

export interface FishingGameOptions {
	/** Element the canvas is appended to. Required. */
	container: HTMLElement
	/**
	 * Root folder of the shared art: it holds `fishing/`, `cursors/` and
	 * `ice-480.webp`. Default: `${BASE_URL}assets`. Pass an absolute URL when the
	 * art lives elsewhere (aukus-svelte points it at the CDN, because the
	 * repository ships no local copies) or when the host serves the game from a
	 * nested route (SvelteKit's relative `BASE_URL` would otherwise resolve
	 * against the current page).
	 */
	publicBase?: string
	/** Base URL of the copied art/font folder. Default: `${publicBase}/fishing`. */
	assetBase?: string
	/** localStorage namespace so multiple games do not share progress. */
	storagePrefix?: string
	/** Start muted. */
	muted?: boolean
	/** Open the menu or jump straight into a session. */
	startScreen?: StartScreen
	/** Called when the player presses "Выход" in the menu (if provided). */
	onExit?: () => void
	/** Called after every landed fish. */
	onCatch?: (event: CatchEvent) => void
	/** Called whenever the persisted progress document changes. */
	onProgress?: (snapshot: ProgressSnapshot) => void
	/** Called when the painter is ready to be interacted with. */
	onReady?: () => void
	/** Optional DB/HTTP-backed progress storage. Default: localStorage. */
	progress?: ProgressRepository
	/**
	 * Water bodies the host keeps closed. `{ rapids: false }` locks the river;
	 * every id that is left out stays open. The game can change the set later
	 * through {@link FishingGameInstance.setLocations}.
	 */
	locations?: AreaLocations
}

export interface FishingGameInstance {
	readonly app: Application
	readonly muted: boolean
	destroy(): void
	pause(): void
	resume(): void
	restart(): void
	showMenu(): void
	setMuted(muted: boolean): void
	/** Opens or closes water bodies; passing `true` unlocks a location again. */
	setLocations(locations: AreaLocations): void
	/** Forces a progress save and resolves when the repository accepted it. */
	flushProgress(): Promise<void>
}

export interface NormalizedOptions {
	container: HTMLElement
	publicBase: string
	assetBase: string
	storagePrefix: string
	muted: boolean
	startScreen: StartScreen
	onExit?: () => void
	onCatch?: (event: CatchEvent) => void
	onProgress?: (snapshot: ProgressSnapshot) => void
	onReady?: () => void
	progress?: ProgressRepository
	/** Every water body's availability after the option pass; `true` is open. */
	locations: Record<AreaId, boolean>
}

import type { Application, Texture } from 'pixi.js'
import type { AreaDef } from './areas'
import type { AssetBag } from './assets'
import type { AudioKit } from './audio'
import type { ProgressTracker } from './progress'
import type { WorldClock } from './world'
import type { AreaId, CatchEvent, NormalizedOptions, WeatherId } from './types'
import type { HelpPageId } from './texts'
import type { WipePoint } from './ui/GridWipe'
import type { UiMetrics } from './ui/metrics'

/**
 * The narrow host contract screens, gameplay and UI use. Keeping it separate
 * from `Game` makes the dependency one-way and lets the tests/tools build a
 * host without a Pixi application.
 */
export interface GameContext {
	readonly app: Application
	readonly options: NormalizedOptions
	readonly assets: AssetBag
	readonly audio: AudioKit
	readonly clock: WorldClock
	readonly progress: ProgressTracker
	readonly area: AreaDef
	readonly areaId: AreaId
	readonly muted: boolean
	/**
	 * The player is on a touch screen: no painted cursor, no hover, bigger
	 * targets, and a fight tuned for a finger. False on a mouse or a stylus.
	 */
	readonly touch: boolean
	/** Sizes the screens are built with; identity table on a fine pointer. */
	readonly ui: UiMetrics

	previewFor(areaId: AreaId): Texture
	helpTexture(page: HelpPageId): Promise<Texture>

	/** True while the host keeps this water body closed. */
	isAreaLocked(areaId: AreaId): boolean

	showMenu(): void
	showHelp(): void
	showCodex(): void
	startGame(areaId?: AreaId, origin?: WipePoint): void
	exit(): void

	setMuted(muted: boolean): void
	toggleMute(): boolean
	handleCatch(event: CatchEvent): void
	flushProgress(): Promise<void>
	setWeather(weather: WeatherId, areaId?: AreaId): void
}

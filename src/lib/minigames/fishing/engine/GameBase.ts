import { Application, Container, Graphics, Texture } from 'pixi.js'
import type { AreaDef } from './areas'
import { AREAS, AREA_BY_ID, DEFAULT_AREA_ID } from './areas'
import { setUiSoundHandler } from './ui/Button'
import { CursorOverlay } from './ui/CursorOverlay'
import { AudioMixPanel } from './ui/AudioMixPanel'
import { DevSkyPanel } from './ui/DevSkyPanel'
import { ZonePanel } from './ui/ZonePanel'
import { ScreenManager } from './ui/ScreenManager'
import { ProgressTracker } from './progress'
import type { SettingsStore } from './storage'
import type { WorldClock } from './world'
import type { AudioKit } from './audio'
import type { AssetBag } from './assets'
import type { AreaId, AreaLocations, NormalizedOptions } from './types'
import { VIEW } from './config'
import { detectInputProfile, pixelRatioCap } from './inputProfile'
import { applyZoneProfile } from './game/fight/zoneTuning'
import { applyUiMetrics, uiMetrics, type UiMetrics } from './ui/metrics'
import { FpsMeter } from './ui/FpsMeter'
import { RenderScale } from './renderScale'

export abstract class GameBase {
	readonly app: Application
	readonly options: NormalizedOptions
	readonly screens = new ScreenManager()
	readonly world = new Container()
	/**
	 * A touch screen gets its own profile: no painted cursor, no hover, touch
	 * target sizes and the touch dash-zone tuning. Everything it changes is read
	 * through `touch` or `ui`, never sniffed per component.
	 */
	readonly touch: boolean
	readonly ui: UiMetrics

	protected assetBag: AssetBag | null = null
	protected audioKit: AudioKit | null = null
	protected settingsStore: SettingsStore | null = null
	protected worldClock: WorldClock | null = null
	protected progressTracker: ProgressTracker | null = null
	protected readonly previews: Partial<Record<AreaId, Texture>> = {}
	/** Gradient stand-ins for previews that are not rendered yet. */
	protected readonly fallbackPreviews = new Map<AreaId, Texture>()
	/**
	 * Which water bodies the host lets the player visit. A locked location keeps
	 * its place in the picker — the card still shows, sealed — so the player can
	 * see that it exists instead of wondering where the third water went.
	 */
	protected readonly locationAccess: Record<AreaId, boolean> = {
		cove: true,
		deep: true,
		rapids: true
	}

	protected bootLayer: Container | null = null
	protected bootFill: Graphics | null = null
	protected cursorOverlay: CursorOverlay | null = null
	protected cursorX = 0
	protected cursorY = 0
	/** Dev audio balance panel, built the first time it is opened. */
	protected audioPanel: AudioMixPanel | null = null
	/** Dev sky inspector (front and hour), built the first time `F3` opens it. */
	protected skyPanel: DevSkyPanel | null = null
	/** Dev dash-zone tuner, built the first time `F8` opens it. */
	protected zonePanel: ZonePanel | null = null
	/** Frame-rate readout, only when the page asked for it with `?fps=1`. */
	protected fpsMeter: FpsMeter | null = null
	/**
	 * Pixel ratio of the canvas: starts at the sharpest the device allows and
	 * steps down while the frame time stays bad (see `renderScale.ts`).
	 */
	protected readonly renderScale: RenderScale

	/** Clips all game content to the 480×270 frame inside the letterbox. */
	protected readonly worldMask = new Graphics()

	protected destroyed = false
	protected pointerInside = false
	protected readonly resizeObserver: ResizeObserver
	protected readonly onKeyDown = (event: KeyboardEvent): void => {
		if (this.destroyed || !this.isEngaged() || this.assetBag === null) return
		// The authoring panels ride on dead keys in a shipped game: F2/F3/F8 open
		// the mixer, the sky inspector and the zone tuner, and while one of them is
		// up it owns the keyboard. A player gets none of that, so the whole branch —
		// the key codes included — lives inside the DEV flag and is compiled out of
		// a production build instead of being compared on every keystroke. It also
		// keeps F8 (devtools' step key) off the shipped page.
		if (import.meta.env.DEV) {
			if (event.code === 'F2' || event.code === 'F3' || event.code === 'F8') {
				event.preventDefault()
				if (event.code === 'F2') this.toggleAudioPanel()
				else if (event.code === 'F3') this.toggleDevPanel()
				else this.toggleZonePanel()
				return
			}
			if (this.audioPanel?.isOpen) {
				// The panel owns the keyboard while it is up: no cast, no pause menu.
				this.audioPanel.handleKey(event)
				event.preventDefault()
				return
			}
			if (this.zonePanel?.handleKey(event)) {
				event.preventDefault()
				return
			}
			if (this.skyPanel?.handleKey(event)) {
				event.preventDefault()
				return
			}
		}
		if (
			event.code === 'Space' ||
			event.code === 'ArrowUp' ||
			event.code === 'ArrowDown' ||
			event.code === 'ArrowLeft' ||
			event.code === 'ArrowRight'
		) {
			event.preventDefault()
		}
		this.screens.handleKey(event)
	}

	protected readonly onKeyUp = (event: KeyboardEvent): void => {
		if (this.destroyed || !this.isEngaged() || this.assetBag === null) return
		this.screens.handleKeyUp(event)
	}

	protected readonly onWheel = (event: WheelEvent): void => {
		if (this.destroyed || !this.isEngaged() || this.assetBag === null) return
		const handled = this.screens.active?.handleWheel(event) ?? false
		if (handled) event.preventDefault()
	}

	protected readonly onVisibility = (): void => {
		if (this.destroyed) return
		// Coming back does NOT resume the round (see below), but the audio context
		// does have to be re-armed: on a phone a call or the app switcher suspends
		// it without the page ever losing it, and the next cast would be silent
		// until the player tapped again.
		if (!document.hidden) {
			this.audioKit?.unlock()
			return
		}
		// Leaving the tab pauses the round; coming back does NOT resume it. The
		// player left mid-fight, so the game waits for a deliberate «продолжить»
		// instead of dropping them back into a landing window they cannot see.
		this.worldClock?.persist()
		void this.progressTracker?.flush()
		this.screens.onHostPause(true)
	}

	protected constructor(app: Application, options: NormalizedOptions) {
		this.app = app
		this.options = options
		// One profile for the whole session, taken before the first screen is
		// built: the metrics are baked into the panels and dialogs, and a layout
		// rebuilt mid-session would move controls under the player's hand.
		this.touch = detectInputProfile() === 'touch'
		// A host that mounts the game before its own CSS settles reports a zero-size
		// container; measuring the viewport instead keeps the metrics from being
		// computed off a 1 px frame, where every control would grow to the cap.
		const host = options.container
		applyUiMetrics(
			host.clientWidth || window.innerWidth,
			host.clientHeight || window.innerHeight,
			this.touch
		)
		this.ui = uiMetrics()
		// The fight table is read by the model *and* the view, so the profile is
		// swapped before the first dash instead of at the first counter.
		applyZoneProfile(this.touch ? 'touch' : 'mouse')
		for (const area of AREAS) {
			this.locationAccess[area.id] = options.locations[area.id] !== false
		}
		this.world.eventMode = 'static'
		this.app.stage.addChild(this.world)

		// The renderer already started at this ratio; the controller may lower it.
		// A phone starts and stays at 1× (see `pixelRatioCap`): the phone profile is
		// a fixed resolution, not a budget the game adapts down from.
		this.renderScale = new RenderScale(
			Math.min(window.devicePixelRatio || 1, pixelRatioCap(this.touch)),
			() => this.applyResize()
		)

		// Optional frame-rate readout: a phone has no devtools, so the only way to
		// answer "is it stuttering?" is to print it on the frame.
		if (FpsMeter.requested()) {
			this.fpsMeter = new FpsMeter(() => this.renderScale.value)
			this.app.stage.addChild(this.fpsMeter)
		}

		// The canvas fills the host and the world is letterboxed inside it. A mask
		// keeps snow, particles and oversized scenery from leaking into the bars.
		this.worldMask.rect(0, 0, VIEW.width, VIEW.height).fill(0xffffff)
		this.worldMask.eventMode = 'none'
		this.app.stage.addChild(this.worldMask)
		this.world.mask = this.worldMask

		this.resizeObserver = new ResizeObserver(() => this.applyResize())
		this.resizeObserver.observe(options.container)

		window.addEventListener('keydown', this.onKeyDown)
		window.addEventListener('keyup', this.onKeyUp)
		app.canvas.addEventListener('wheel', this.onWheel, { passive: false })
		document.addEventListener('visibilitychange', this.onVisibility)
		app.canvas.addEventListener('pointerdown', this.focusCanvas)
		app.canvas.addEventListener('pointerenter', this.onPointerEnter)
		app.canvas.addEventListener('pointerleave', this.onPointerLeave)
		app.canvas.addEventListener('pointermove', this.onCursorMove)
		app.ticker.add(this.tick)

		setUiSoundHandler((kind) => {
			if (!this.audioKit) return
			if (kind === 'click') this.audioKit.click()
			else this.audioKit.hover()
		})
	}
	get assets(): AssetBag {
		if (!this.assetBag) throw new Error('[fishing] assets are not loaded yet')
		return this.assetBag
	}

	get audio(): AudioKit {
		if (!this.audioKit) throw new Error('[fishing] audio is not ready yet')
		return this.audioKit
	}

	get settings(): SettingsStore {
		if (!this.settingsStore) {
			throw new Error('[fishing] settings are not ready yet')
		}
		return this.settingsStore
	}

	/** Persistent time of day and weather front, shared by every screen. */
	get clock(): WorldClock {
		if (!this.worldClock) {
			throw new Error('[fishing] world clock is not ready yet')
		}
		return this.worldClock
	}

	/** Player progress: codex, area visits and the selected water body. */
	get progress(): ProgressTracker {
		if (!this.progressTracker) {
			throw new Error('[fishing] progress is not ready yet')
		}
		return this.progressTracker
	}

	get area(): AreaDef {
		return AREA_BY_ID[this.areaId] ?? AREA_BY_ID[DEFAULT_AREA_ID]
	}

	/**
	 * The selected water body, falling back to the default one. A saved or
	 * hand-passed id that no longer exists (a renamed area, a stale session) used
	 * to reach the screen as `undefined` and crash on `area.layout`. A location
	 * the host has closed is treated the same way: the game never opens on water
	 * the player is not allowed to fish.
	 */
	get areaId(): AreaId {
		const saved = this.progressTracker?.snapshot.selectedArea
		const area = saved && saved in AREA_BY_ID ? saved : DEFAULT_AREA_ID
		return this.isAreaLocked(area) ? this.firstOpenAreaId() : area
	}

	/** True while the host keeps this water body closed. */
	isAreaLocked(areaId: AreaId): boolean {
		return this.locationAccess[areaId] === false
	}

	/**
	 * First water body still open, in table order. Falls back to the default one
	 * when the host closed everything: a game with no playable water is a host
	 * bug, and the picker still has to draw something.
	 */
	protected firstOpenAreaId(): AreaId {
		return AREAS.find((area) => !this.isAreaLocked(area.id))?.id ?? DEFAULT_AREA_ID
	}

	/**
	 * Applies a new availability set. Called before the screens render it, so a
	 * location that just closed cannot be entered on the way out. The saved
	 * selection moves off a shore the host has just taken away.
	 */
	protected applyLocations(locations: AreaLocations): void {
		for (const area of AREAS) {
			const open = locations[area.id]
			if (typeof open === 'boolean') this.locationAccess[area.id] = open
		}
		const saved = this.progressTracker?.snapshot.selectedArea
		if (saved && this.isAreaLocked(saved)) {
			this.progressTracker?.setArea(this.firstOpenAreaId())
		}
	}

	get muted(): boolean {
		return this.audioKit?.isMuted ?? this.options.muted
	}

	protected tick = (): void => {
		if (this.destroyed) return
		// The meter reads the raw frame delta, before the clamp below: a hitch that
		// the game smooths away is exactly what it has to report.
		const frameMs = this.app.ticker.deltaMS / 1000
		this.fpsMeter?.frame(frameMs)
		// The ratio is judged on the game, not on the loading screen: the boot is a
		// flat gradient that decodes assets, and dropping the picture for its frames
		// would punish every phone on a cold start.
		if (!this.bootLayer) this.renderScale.frame(frameMs)
		// A 10 fps frame still moves the round in real time; the fight catches up
		// in fixed 1/60 s steps of its own. Below that the round slows down instead
		// of letting one delta jump a whole telegraph or bite window.
		const dt = Math.min(this.app.ticker.deltaMS / 1000, 0.1)
		if (this.bootLayer) {
			return
		}
		// The sky follows the wall clock, so it advances on every screen and even
		// after the tab was hidden: `update` touches the save only when a front
		// actually changed.
		if (this.worldClock?.update()) this.worldClock.persist()
		this.screens.update(dt)
		this.updateCursor()
	}
	setMuted(muted: boolean): void {
		this.audio.setMuted(muted)
		this.settings.muted = muted
		this.screens.active?.onMuteChanged()
	}

	toggleMute(): boolean {
		this.setMuted(!this.muted)
		return this.muted
	}

	protected isEngaged(): boolean {
		const canvas = this.app.canvas
		return (
			document.activeElement === canvas ||
			this.pointerInside ||
			this.options.container.contains(document.activeElement)
		)
	}

	protected focusCanvas = (): void => {
		this.audio.unlock()
		this.app.canvas.focus({ preventScroll: true })
	}

	protected onPointerEnter = (event: PointerEvent): void => {
		this.onCursorMove(event)
	}

	protected onPointerLeave = (): void => {
		this.pointerInside = false
		this.cursorOverlay?.hide()
	}

	protected onCursorMove = (event: PointerEvent): void => {
		const rect = this.app.canvas.getBoundingClientRect()
		if (rect.width <= 0 || rect.height <= 0) return
		this.cursorX = (event.clientX - rect.left) * (this.app.screen.width / rect.width)
		this.cursorY = (event.clientY - rect.top) * (this.app.screen.height / rect.height)
		this.pointerInside = true
		this.updateCursor()
	}

	protected abstract applyResize(): void
	protected abstract updateCursor(): void
	protected abstract toggleAudioPanel(): void
	protected abstract toggleDevPanel(): void
	protected abstract toggleZonePanel(): void
}

import { Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import { VIEW } from './config'
import logoUrl from '../art/aukus-logo.png'

import { TEXT, type HelpPageId } from './texts'
import { AREA_BY_ID, AREAS, DEFAULT_AREA_ID, type AreaDef } from './areas'
import { drawPanel, makeText, setText } from './ui/theme'
import { anchorInk, realignInk } from './ui/textInk'
import { UI } from './ui/palette'
import { loadGameAssets, loadHelpTexture, prefetchHelpPages } from './assets'
import { loadCursorTextures } from './cursors'
import { createFishingScene } from './game/scenes'
import { IceVeil } from './ui/IceVeil'
import { SettingsStore, WorldStore } from './storage'
import { mixColor, WorldClock } from './world'
import { AudioKit } from './audio'
import { mixWith } from './audioMix'
import { enterFullscreen } from './fullscreen'
import { LocalProgressRepository, ProgressTracker, parseProgress } from './progress'
import type { CursorTextures } from './cursors'
import type { AreaId } from './types'
import { GameBase } from './GameBase'

/** Minimum time the loading screen stays up, in milliseconds. */
const BOOT_MIN_MS = 1300

/** Progress rail of the boot screen; the caption row hangs off its top edge. */
const BAR = { x: 140, y: 146, width: 200, height: 12 } as const
/** Gap between the caption row and the rail. */
const ROW_GAP = 4
/** Gap between the rail and the stage caption printed under it. */
const STAGE_GAP = 3
/**
 * Progress at which each boot stage hands over to the next.
 *
 * The stages are the order the loader actually works in — fonts, then the
 * water bodies' own art, then the forty fish, then the sample pack — and these
 * cuts follow its weights (textures are 72% of the rail, sounds 23%). They are
 * approximate on purpose: the caption describes what the boot is doing, and a
 * number that has to be exactly right for a phrase to appear is not a caption.
 */
const STAGE_CUTS = [0.15, 0.35, 0.72, 0.97] as const
/**
 * The wordmark block: a small site mark at the top, the game's name below it.
 *
 * The AUKUS logo is a corner mark here, the size and place it has over the map
 * on the main page — a brand stamp, not the subject of the screen. The game's
 * own name carries the loading screen, at the same size it has on the menu.
 *
 * The image is bundled (`art/aukus-logo.png`), never fetched from the art CDN:
 * a texture has to be a clean source for WebGL, and an image from another origin
 * only qualifies when the bucket answers CORS — which it does not, and which
 * showed up as a `texImage2D` SecurityError on the first frame.
 */
const WORDMARK = { width: 76, top: 8 } as const
/**
 * The game's name: one size for the loading screen and the menu.
 *
 * Between the 28 px the loading screen used and the 44 px the menu grew to — the
 * name is the biggest word in both places now, and it stays the same word.
 */
const TITLE = { size: 36, y: 92 } as const

/** The stage caption for a point on the rail. */
function bootStage(progress: number): string {
	const stages = TEXT.boot.stages
	let index = 0
	while (index < STAGE_CUTS.length && progress > STAGE_CUTS[index]) {
		index += 1
	}
	return stages[Math.min(index, stages.length - 1)]
}

export abstract class GameBootLayer extends GameBase {
	/** «ЗАГРУЗКА…» caption over the rail. */
	private bootCaption: Text | null = null
	/** Percentage under the progress rail. */
	private bootPercent: Text | null = null
	/** Stage caption under the rail: what the boot is doing, never a file name. */
	private bootStageLine: Text | null = null
	/** Wordmark block: the host's logo, or the game title until it lands. */
	private bootWordmark: Container | null = null
	/** Fallback title, hidden the moment a logo is drawn over it. */
	private bootTitle: Text | null = null
	private bootLogo: Sprite | null = null

	previewFor(areaId: AreaId): Texture {
		const ready = this.previews[areaId] ?? this.previews[DEFAULT_AREA_ID]
		if (ready) return ready
		// The two water bodies that are not selected are rendered on idle after
		// the menu is up; until then the cheap gradient stands in for them.
		let fallback = this.fallbackPreviews.get(areaId)
		if (!fallback) {
			fallback = this.fallbackPreview(AREA_BY_ID[areaId] ?? this.area)
			this.fallbackPreviews.set(areaId, fallback)
		}
		return fallback
	}

	/** Help screenshots are lazy: the screen paints first, the shot follows. */
	helpTexture(page: HelpPageId): Promise<Texture> {
		return loadHelpTexture(this.options.assetBase, page, this.touch)
	}

	protected async boot(): Promise<void> {
		const startedAt = performance.now()
		this.mountBoot()

		// The game paints the pointer itself, so cursors are the first request of
		// the boot and the overlay is mounted the frame they land. Requesting them
		// last, as part of the art bag, left the whole loading screen without a
		// cursor until the menu was ready. A touch screen never mounts the overlay
		// (see `mountCursor`); the textures still ride the bag the loader expects.
		const cursorsPromise = loadCursorTextures(this.options.publicBase)
		void cursorsPromise.then((cursors) => {
			if (!this.destroyed && !this.touch) this.mountCursor(cursors)
		})

		// Decorative frost over every screen. It is fetched alongside the rest of
		// the art but never awaited: a missing or slow ice.png must not hold the
		// boot screen, and the veil is attached whenever it arrives.
		const veil = IceVeil.load(`${this.options.publicBase}/ice-480.webp`)

		const repository =
			this.options.progress ?? new LocalProgressRepository(this.options.storagePrefix)
		const progressPromise = repository.load().catch((error: unknown) => {
			console.warn('[fishing] progress load failed', error)
			return null
		})

		// Audio is built before the art so the whole sample pack can be fetched
		// and decoded in parallel with the textures. The context is created
		// suspended: browsers only allow playback after a gesture, but decoding
		// does not need one, so every cue and bed is ready for the first cast.
		this.settingsStore = new SettingsStore(this.options.storagePrefix)
		this.audioKit = new AudioKit(
			this.settingsStore.muted ?? this.options.muted,
			this.options.assetBase,
			mixWith(this.settingsStore.mix)
		)

		// One rail for two independent loads: art dominates the early part, the
		// sample pack the tail; neither may make the bar jump backwards.
		let textureProgress = 0
		let soundProgress = 0
		const reportBoot = (): void => {
			this.setBootProgress(Math.min(0.99, 0.05 + textureProgress * 0.72 + soundProgress * 0.23))
		}
		const soundsPromise = this.audioKit.preloadAllSounds((loaded, total) => {
			soundProgress = total > 0 ? loaded / total : 1
			reportBoot()
		})
		reportBoot()

		const [bag, rawProgress] = await Promise.all([
			loadGameAssets(
				this.options.assetBase,
				(progress) => {
					textureProgress = progress
					reportBoot()
				},
				cursorsPromise
			),
			progressPromise,
			soundsPromise
		])

		this.assetBag = bag
		this.worldClock = new WorldClock(new WorldStore(this.options.storagePrefix))
		this.progressTracker = new ProgressTracker(repository, parseProgress(rawProgress))
		this.progressTracker.onChange = (snapshot) => this.options.onProgress?.(snapshot)

		// Menus show a still of the selected water body, so the water bed starts
		// with the boot instead of the first cast. The bed only queues here; it is
		// applied by `AudioKit.unlock` on the first gesture.
		this.audioKit.setAmbience(this.areaId)

		// Only the selected water body is rendered before the menu. The other two
		// previews are three full scene draws each; on software rendering they
		// were the last two long tasks of the boot, for pictures nobody was
		// looking at yet.
		this.buildAreaPreview(this.area)

		// A warm cache can finish the whole load in two frames. The loading screen
		// is a designed beat, so it gets a moment to be seen: complete the rail and
		// hold it for the rest of the minimum, then hand over to the menu.
		this.setBootProgress(1)
		const left = BOOT_MIN_MS - (performance.now() - startedAt)
		if (left > 0) await new Promise((resolve) => setTimeout(resolve, left))

		// On a phone the first tap is the gesture that may take the page fullscreen
		// (the host asks for it on `pointerdown`) and that starts Web Audio, so the
		// loading screen waits for it instead of handing over a silent menu.
		if (this.touch) await this.awaitStart()

		this.unmountBoot()
		this.world.addChild(this.screens.layer)
		void veil.then((overlay) => {
			if (overlay && !this.destroyed) this.screens.setVeil(overlay)
			else overlay?.destroy({ children: true })
		})

		if (this.options.startScreen === 'game') {
			this.startGame()
		} else {
			this.showMenu()
		}
		this.applyResize()
		this.options.onReady?.()
		this.warmInBackground()
	}

	protected warmInBackground(): void {
		const run = (): void => {
			if (this.destroyed) return
			for (const area of AREAS) this.buildAreaPreview(area)
			void prefetchHelpPages(this.options.assetBase, this.touch)
		}
		if (typeof window.requestIdleCallback === 'function') {
			window.requestIdleCallback(run, { timeout: 1500 })
		} else {
			window.setTimeout(run, 300)
		}
	}

	/**
	 * Renders one scene once and keeps the resulting texture. Cards and menu
	 * backdrops then show a real screenshot of the water body instead of a
	 * hand-drawn approximation.
	 */
	protected buildAreaPreview(area: AreaDef): void {
		if (!this.assetBag || this.previews[area.id]) return
		const scene = createFishingScene(area, this.assetBag)
		try {
			scene.update(1 / 60)
			this.previews[area.id] = this.app.renderer.extract.texture({
				target: scene,
				frame: new Rectangle(0, 0, VIEW.width, VIEW.height),
				resolution: 1
			})
		} catch (error) {
			console.warn(`[fishing] preview for ${area.id} failed`, error)
			this.previews[area.id] = this.fallbackPreview(area)
		} finally {
			scene.destroy({ children: true })
		}
	}

	protected fallbackPreview(area: AreaDef): Texture {
		const canvas = document.createElement('canvas')
		canvas.width = VIEW.width
		canvas.height = VIEW.height
		const ctx = canvas.getContext('2d')
		if (!ctx) return Texture.WHITE
		const stops = area.palette.waterStops
		const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height)
		for (const stop of stops) {
			gradient.addColorStop(stop.at, `#${stop.color.toString(16).padStart(6, '0')}`)
		}
		ctx.fillStyle = gradient
		ctx.fillRect(0, 0, VIEW.width, VIEW.height)
		ctx.fillStyle = `#${area.palette.farShore.toString(16).padStart(6, '0')}`
		ctx.fillRect(0, 0, VIEW.width, 26)
		ctx.fillStyle = `#${area.palette.snow.toString(16).padStart(6, '0')}`
		ctx.fillRect(0, 24, VIEW.width, 3)
		const texture = Texture.from(canvas)
		texture.source.scaleMode = 'nearest'
		return texture
	}
	protected mountBoot(): void {
		const layer = new Container()
		const bg = new Graphics()
		// Practical, not scenic: a calm two-step background that carries the title
		// and the progress, nothing that has to be read while the game is loading.
		for (let y = 0; y < VIEW.height; y += 1) {
			const t = y / VIEW.height
			bg.rect(0, y, VIEW.width, 1).fill(mixColor(UI.ink, UI.night, t))
		}

		// Wordmark: the site's logo, and the game's name under it. The title is
		// drawn first so it is there on the very first frame — the logo lands a
		// decode later and simply takes its place above.
		const wordmark = new Container()
		this.bootWordmark = wordmark
		this.bootTitle = makeText(TEXT.menu.title, {
			size: TITLE.size,
			weight: 800,
			color: UI.text,
			align: 'center',
			letterSpacing: 0.5,
			outline: true
		})
		this.bootTitle.position.set(VIEW.width / 2, TITLE.y)
		// The wordmark is anchored on its glyphs: the constant text box is almost
		// twice the cap height, and the top of that box pushed it down onto the
		// progress block.
		anchorInk(this.bootTitle, 'center', 'top')
		wordmark.addChild(this.bootTitle)
		this.loadBootLogo()

		// The caption and the percentage are one row over the rail: the caption
		// hangs off the rail's left edge, the number off its right, so the pair
		// reads as the two ends of the bar instead of a centred caption with a
		// stray number under it. No hairline above them: the rule that used to
		// separate the wordmark from the loading block cut the screen in two and
		// read as a second divider under the logo.
		this.bootCaption = makeText(`${TEXT.boot.loading}${TEXT.common.ellipsis}`, {
			size: 7,
			weight: 800,
			color: UI.textMuted,
			letterSpacing: 1.5
		})
		anchorInk(this.bootCaption, 'left', 'bottom')
		this.bootCaption.position.set(BAR.x, BAR.y - ROW_GAP)

		this.bootPercent = makeText('0%', {
			size: 7,
			weight: 800,
			color: UI.text,
			align: 'right'
		})
		anchorInk(this.bootPercent, 'right', 'bottom')
		this.bootPercent.position.set(BAR.x + BAR.width, BAR.y - ROW_GAP)

		const barBg = new Graphics()
		drawPanel(barBg, BAR.x, BAR.y, BAR.width, BAR.height, {
			fill: UI.ink,
			inner: false
		})

		this.bootFill = new Graphics()

		// The stage of the boot, under the rail: the one thing that tells a player
		// staring at a stuck bar that the game is still working. It names what the
		// loader is doing — fonts, water bodies, fish, sound — instead of the file
		// it happens to be on, which said nothing and had to be cut to fit.
		this.bootStageLine = makeText('', {
			size: 6,
			color: UI.textMuted,
			letterSpacing: 0.4
		})
		anchorInk(this.bootStageLine, 'left', 'top')
		this.bootStageLine.position.set(BAR.x, BAR.y + BAR.height + STAGE_GAP)

		layer.addChild(
			bg,
			// After the background, or the full-frame gradient paints over the mark.
			wordmark,
			this.bootCaption,
			this.bootPercent,
			barBg,
			this.bootFill,
			this.bootStageLine
		)
		this.bootLayer = layer
		this.world.addChild(layer)
		// A small stub so the first painted frame already shows a live rail.
		this.setBootProgress(0.02)
	}

	/**
	 * Decodes the logo and draws it as a small mark over the title.
	 *
	 * Same-origin, so the plain `Image` is a clean WebGL source. The title is
	 * already on screen and stays: a logo that fails to decode costs the mark,
	 * not the name of the game.
	 */
	private loadBootLogo(): void {
		const image = new Image()
		image.decoding = 'async'
		image.onload = () => {
			if (this.destroyed || !this.bootWordmark) return
			const sprite = new Sprite(Texture.from(image))
			sprite.anchor.set(0.5, 0)
			sprite.width = WORDMARK.width
			// `width` only scales the x axis; the height has to follow it or the mark
			// would be drawn squashed to its source height.
			sprite.scale.y = sprite.scale.x
			sprite.position.set(VIEW.width / 2, WORDMARK.top)
			this.bootWordmark.addChild(sprite)
			this.bootLogo = sprite
		}
		image.onerror = () => {
			// Nothing to do: the game's title is already on screen.
		}
		image.src = logoUrl
	}

	protected setBootProgress(progress: number): void {
		if (!this.bootFill) return
		const clamped = Math.max(0.02, Math.min(1, progress))
		this.bootFill.clear()
		this.bootFill
			.rect(BAR.x + 2, BAR.y + 2, (BAR.width - 4) * clamped, BAR.height - 4)
			.fill({ color: UI.periwinkle, alpha: 0.95 })
		this.bootFill
			.rect(BAR.x + 2, BAR.y + 2, (BAR.width - 4) * clamped, 2)
			.fill({ color: UI.primary, alpha: 0.9 })
		if (this.bootPercent) {
			this.bootPercent.text = `${Math.round(clamped * 100)}%`
			realignInk(this.bootPercent)
		}
		if (this.bootStageLine) {
			// The caption describes work in progress, so a full rail has nothing to
			// say: at 100% it goes, instead of parking its last stage under a bar
			// that has already finished.
			const loading = clamped < 1
			this.bootStageLine.visible = loading
			if (loading) setText(this.bootStageLine, bootStage(clamped))
		}
	}

	/**
	 * Waits for the tap that starts the session.
	 *
	 * The prompt is the point: on a phone that same gesture lets the browser go
	 * fullscreen (the host asks for it on `pointerdown`) and unlocks Web Audio,
	 * which otherwise stays silent until something is pressed. Touch only — a
	 * desktop player is not given an extra click.
	 */
	private awaitStart(): Promise<void> {
		return new Promise((resolve) => {
			if (!this.bootLayer) {
				resolve()
				return
			}
			const hint = makeText(TEXT.boot.pressToStart, {
				size: 8,
				weight: 700,
				color: UI.text,
				align: 'center',
				letterSpacing: 1
			})
			anchorInk(hint, 'center', 'top')
			hint.position.set(VIEW.width / 2, BAR.y + BAR.height + 12)
			this.bootLayer.addChild(hint)

			const pulse = (): void => {
				const t = this.app.ticker.lastTime / 1000
				hint.alpha = 0.55 + Math.sin(t * 3) * 0.45
			}
			this.app.ticker.add(pulse)

			const finish = (): void => {
				this.app.ticker.remove(pulse)
				this.app.canvas.removeEventListener('pointerdown', finish)
				window.removeEventListener('keydown', finish)
				hint.destroy()
				// The tap is the gesture the context was waiting for.
				this.audioKit?.unlock()
				// And the gesture the browser wants before it will hide its own address
				// bar. It has to be used inside this handler — a moment later, on the
				// menu, it is spent and the request is refused — which is the whole
				// reason the loading screen asks for a tap on a phone. A refusal (iOS,
				// an iframe, a policy) is not an error: the game stays in its tab.
				enterFullscreen()
				// The release of that same tap lands a moment later. Handing the menu
				// over immediately would let it hit whatever row appears under the
				// finger — the first tap of the session would open the codex. The boot
				// screen holds for a beat instead, and the release falls on nothing.
				window.setTimeout(resolve, 220)
			}
			this.app.canvas.addEventListener('pointerdown', finish)
			window.addEventListener('keydown', finish)
		})
	}

	protected unmountBoot(): void {
		if (!this.bootLayer) return
		// The logo's texture was built from a bare Image, so nothing else owns it:
		// dropping it with the sprite keeps a 1024 px bitmap out of the session.
		this.bootLogo?.destroy({ texture: true, textureSource: true })
		this.world.removeChild(this.bootLayer)
		this.bootLayer.destroy({ children: true })
		this.bootLayer = null
		this.bootFill = null
		this.bootPercent = null
		this.bootCaption = null
		this.bootStageLine = null
		this.bootWordmark = null
		this.bootTitle = null
		this.bootLogo = null
	}
	protected abstract mountCursor(cursors: CursorTextures): void
	abstract showMenu(): void
	abstract startGame(areaId?: AreaId): void
}

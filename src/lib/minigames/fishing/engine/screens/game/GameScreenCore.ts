import { Container, Graphics, Rectangle } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import type { GameContext } from '../../GameContext'
import type { AreaDef } from '../../areas'
import type { AreaId } from '../../types'
import { VIEW } from '../../config'
import { CURSORS } from '../../cursors'
import { Screen } from '../../ui/Screen'
import { AreaShortcuts } from '../../ui/AreaShortcuts'
import { CastHint } from '../../ui/CastHint'
import { CodexOverlay } from '../../ui/CodexOverlay'
import { FloaterLayer } from '../../ui/FloaterLayer'
import { GameHud } from '../../ui/GameHud'
import { PauseMenu } from '../../ui/PauseMenu'
import { TutorialHint } from '../../ui/TutorialHint'
import { FightControls } from '../../ui/fight/FightControls'
import type { WipePoint } from '../../ui/GridWipe'
import { WeatherForecast } from '../../ui/WeatherForecast'
import { Atmosphere } from '../../game/Atmosphere'
import { CastFlow } from '../../game/CastFlow'
import { FightFocus } from '../../game/FightFocus'
import { JuiceFx } from '../../game/JuiceFx'
import { createFishingScene } from '../../game/scenes'
import type { FishingScene } from '../../game/scenes/FishingScene'

export abstract class GameScreenCore extends Screen {
	protected abstract trackPointer(event: FederatedPointerEvent): void
	protected abstract closePause(silent?: boolean): void
	/**
	 * A lesson in the corner took the input, or gave it back. Implemented by the
	 * overlay layer, which owns the note and the frozen round under it.
	 */
	protected abstract dismissLessonForInput(): boolean
	protected readonly game: GameContext
	protected readonly area: AreaDef
	protected readonly scene: FishingScene
	protected readonly atmosphere = new Atmosphere()
	protected readonly playfield = new Container()
	protected readonly hud: GameHud
	protected readonly castHint: CastHint
	protected readonly fx = new Container()
	/** Fight UI that must stay legible in weather: the stamina bars. */
	protected readonly fightHud = new Container()
	protected readonly floaters = new FloaterLayer()
	protected readonly bobberLayer = new Container()
	protected readonly juice = new JuiceFx()
	protected readonly focus = new FightFocus()
	protected readonly inputCatcher: Graphics
	protected readonly flow: CastFlow
	protected readonly pauseMenu: PauseMenu
	protected readonly shortcuts: AreaShortcuts
	/**
	 * Touch controls of the fight, or null on a mouse. They exist only while a
	 * fight runs: the cast is played on the water, which has nothing to read.
	 */
	protected readonly fightControls: FightControls | null
	/** Sky rail in the bottom centre: the next fronts and when they arrive. */
	protected readonly forecast: WeatherForecast
	/** Last availability pushed to the travel cards, to avoid redrawing them. */
	protected shortcutsAvailable = true
	/**
	 * Pointer that owns this round's gesture: the aim, the hold and the release.
	 * A second finger on the glass is not part of it — see the input handlers in
	 * the constructor.
	 */
	protected activePointerId: number | null = null
	protected readonly handleContextMenu = (event: MouseEvent): void => {
		// The browser menu is never wanted over the water, whatever the input.
		event.preventDefault()
		// A long press on a phone raises the same event as a right click, and used
		// to loose a final pull the player never asked for — half the fights were
		// ended by holding still.
		if (this.game.touch) return
		this.flow.finalPull()
	}

	protected paused = false
	protected codex: CodexOverlay | null = null
	/** The lesson in the corner, if the manual is open over the round. */
	protected tutorial: TutorialHint | null = null

	constructor(game: GameContext, area: AreaDef) {
		super()
		this.game = game
		this.area = area

		this.castHint = new CastHint(area.layout.hint.x, area.layout.hint.y, {
			mouse: game.assets.mouse,
			touch: game.touch,
			labelSize: game.ui.font(7),
			badgeSize: game.ui.pick(11, 14)
		})
		this.scene = createFishingScene(area, game.assets)
		this.addChild(this.playfield)
		this.playfield.addChild(this.scene)

		this.atmosphere.setMood(area.mood)
		this.atmosphere.setLight(area.layout.light?.x ?? null, area.layout.light?.glowY ?? null)
		// Fog closes in on the water the angler is fishing, not just on his boots:
		// the clear pocket sits between him and the float band, so the float stays
		// readable while the rest of the lake disappears.
		const band = area.layout.bobber
		const bandX = (band.minX + band.maxX) / 2
		const bandY = band.centerY ?? (band.minY + band.maxY) / 2
		// Biased towards the water (0.6 of the way) so the float and the fight stay
		// in the clear patch while the angler stays on its near edge.
		this.atmosphere.setFocus(
			area.layout.angler.x + (bandX - area.layout.angler.x) * 0.6,
			area.layout.angler.y + (bandY - area.layout.angler.y) * 0.6
		)
		// Falling snow needs the waterline to ring on: the atmosphere asks the
		// scene, so a drop never splashes on the pier or the bank.
		this.atmosphere.setWaterTest((x, y) => this.scene.isWaterAt(x, y))
		const palette = game.clock.palette
		const weatherDef = game.clock.weatherDefFor(area.id)
		this.scene.tint = palette.tint
		this.scene.setLantern(palette.lantern)
		// The first frame shows the current cover, not a clear sky fading in.
		this.scene.snapCloudiness(weatherDef.cloud)
		this.atmosphere.setWorld(palette, weatherDef)

		// Purely visual layers (minigame frame) must never intercept pointer events
		// meant for the input catcher. The playfield is the only filtered layer;
		// HUD and floaters stay crisp above it.
		this.playfield.addChild(this.fx)
		this.fx.eventMode = 'none'
		// The float is lifted above the minigame while the fight is active, so it
		// stays on top of the fish that carries it.
		this.playfield.addChild(this.bobberLayer)
		this.bobberLayer.eventMode = 'none'
		// Weather goes last: fog and snow have to sit on top of the float, the line
		// and the hooked fish. Drawn above them the fight ring and the float stayed
		// crisp in thick fog, which looked pasted onto the scene instead of in it.
		this.playfield.addChild(this.atmosphere)
		// The fight darkens the lake, so it goes over the weather: fog only reaches
		// the edge of the clear patch instead of washing the spot out.
		this.playfield.addChild(this.focus)
		// The stamina bars are the one part of the fight that has to survive both
		// the weather and the darkening: a gauge the player reads to decide a tap
		// cannot be dimmed.
		this.playfield.addChild(this.fightHud)
		this.fightHud.eventMode = 'none'
		this.juice.attachTo(this.playfield)

		this.flow = new CastFlow({
			game,
			area,
			scene: this.scene,
			juice: this.juice,
			floaters: this.floaters,
			fightLayer: this.fx,
			bobberLayer: this.bobberLayer,
			barsLayer: this.fightHud,
			focus: this.focus
		})

		this.inputCatcher = new Graphics()
		this.inputCatcher.eventMode = 'static'
		this.inputCatcher.hitArea = new Rectangle(0, 0, VIEW.width, VIEW.height)

		// One gesture at a time. The first pointer down owns the aim, the hold and
		// the release; a second finger is not allowed to move the aim, and letting
		// go of it must not end the hold the first one still has. Before this, a
		// resting thumb on the glass cancelled the cast the other hand had charged.
		const ownsGesture = (event: FederatedPointerEvent): boolean =>
			this.activePointerId === null || event.pointerId === this.activePointerId

		this.inputCatcher.on('pointerdown', (event) => {
			// The press point is the gesture's anchor — the counter is a drag *from
			// where the press landed* — so it is recorded before anything can unfreeze
			// the round. A lesson dismissed by this very press used to leave the anchor
			// on the click that opened it, and the drag from the sector was then read
			// as a drag from somewhere else.
			this.trackPointer(event)
			// A lesson in the corner owns the first press: while it holds the round
			// the press is swallowed, and after that the press ends the lesson and
			// goes through as the action it was. On a finger it is the round's own
			// controls that close the note — the chip and the stick ask for it in
			// their handlers — because the water is not a control there: a thumb
			// resting on the glass must not talk over a rule the player is reading.
			if (!this.game.touch && this.dismissLessonForInput()) return
			// On a touch screen a round is played with the chip and the stick: the
			// water is not a control, so a stray thumb can neither cast nor spook the
			// fish. The one exception is the catch display, which a tap still skips.
			if (this.game.touch && this.flow.phase !== 'resolve') return
			if (this.activePointerId === null) {
				this.activePointerId = event.pointerId
				this.flow.pointerDown(event.button, event.pointerType, event.pointerId)
				return
			}
			if (event.pointerId === this.activePointerId) return
			// The one thing a second finger may do is tap the tired fish: landing is
			// a tap in a thumb-sized circle, and a player holding the line with one
			// hand should not have to let go to finish the catch.
			if (event.pointerType !== 'mouse') {
				const point = event.getLocalPosition(this)
				this.flow.secondaryTap(point.x, point.y)
			}
		})
		this.inputCatcher.on('pointermove', (event) => {
			if (ownsGesture(event)) this.trackPointer(event)
		})
		this.inputCatcher.on('globalpointermove', (event) => {
			if (ownsGesture(event)) this.trackPointer(event)
		})
		const release = (event: FederatedPointerEvent): void => {
			if (event.pointerId !== this.activePointerId) return
			this.activePointerId = null
			this.flow.pointerUp(event.pointerId)
		}
		const cancel = (event: FederatedPointerEvent): void => {
			if (event.pointerId !== this.activePointerId) return
			this.activePointerId = null
			this.flow.pointerCancel(event.pointerId)
		}
		// The finger that left the frame, the platform's own cancel and the tab
		// going away all end the gesture; the other fingers never do.
		this.inputCatcher.on('pointerup', release)
		this.inputCatcher.on('pointerupoutside', cancel)
		this.inputCatcher.on('pointercancel', cancel)
		this.addChild(this.inputCatcher)
		this.inputCatcher.cursor = CURSORS.default

		this.hud = new GameHud(area, game.ui, game.assets.fullscreen, {
			onPause: () => this.openPause(),
			onCodex: () => this.openCodex()
		})
		this.hud.addChild(this.castHint)
		this.addChild(this.hud)

		// The fight's own controls, touch only: a stick under the left thumb and the
		// landing button under the right one. They sit above the input catcher, so
		// the round never mistakes a pull for a tap on the water, and they are shown
		// only while a fight runs.
		this.fightControls = game.touch
			? new FightControls(
					{
						// A lesson owns the first press on the touch controls exactly as it
						// owns one on the water: `dismissLessonForInput` reports whether the
						// press has to be swallowed or may go through.
						onHold: (held) => {
							if (held && this.dismissLessonForInput()) return
							this.flow.setStickHold(held)
						},
						onDirection: (x, y) => this.flow.setStickDirection(x, y),
						onGrab: (angle) => {
							if (this.dismissLessonForInput()) return
							this.flow.stickGrab(angle)
						},
						onCastHold: (held) => {
							if (held && this.dismissLessonForInput()) return
							this.flow.castHold(held)
						},
						onLand: () => {
							if (this.dismissLessonForInput()) return
							this.flow.finalPull()
						}
					},
					// The chip's two marks — the rod and the hook — are the project's own
					// 16 px sheets, cut by the asset bag.
					{ rod: game.assets.rod, hook: game.assets.hook }
				)
			: null
		if (this.fightControls) {
			this.fightControls.setMode('hidden')
			this.addChild(this.fightControls)
		}

		// Travel cards: the other two water bodies, reachable in one click instead
		// of a trip through the pause menu and the picker.
		this.shortcuts = new AreaShortcuts(game, area.id, (areaId, origin) => {
			this.switchArea(areaId, origin)
		})
		this.addChild(this.shortcuts)

		// The forecast sits between the two travel cards: the corners say where
		// you can go, the middle says what the sky will do while you are there.
		this.forecast = new WeatherForecast(game, area.id)
		this.addChild(this.forecast)

		this.addChild(this.floaters)

		this.pauseMenu = new PauseMenu(game, {
			onResume: () => this.closePause(true)
		})
		this.addChild(this.pauseMenu)

		// The round opens with the rod held back until its first note has been read
		// (see `CastFlowCore.setCastLocked`): the note needs the grid wipe to finish,
		// and a press inside that half-second used to start a cast the lesson then
		// never interrupted. A lesson in the saved document needs no such wait.
		this.flow.setCastLocked(!game.progress.lessonSeen('cast'))

		this.game.app.canvas.addEventListener('contextmenu', this.handleContextMenu)
	}

	/**
	 * Gives up the current gesture. The pause paths call it: the tab can be
	 * hidden, or the round frozen by a codex, while a finger is still down, and
	 * the release that would end the gesture never arrives. Without this the
	 * round would keep a pointer that is no longer there and ignore every press
	 * after it.
	 */
	protected resetGesture(): void {
		this.fightControls?.cancel()
		if (this.activePointerId === null) return
		this.activePointerId = null
		this.flow.pointerCancel()
	}

	protected abstract openPause(): void
	protected abstract openCodex(): void
	protected abstract switchArea(areaId: AreaId, origin: WipePoint): void
}

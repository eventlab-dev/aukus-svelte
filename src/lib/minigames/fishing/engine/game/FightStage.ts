import type { Container } from 'pixi.js'
import type { GameContext } from '../GameContext'
import type { FishSpecies } from '../config'
import { TEXT } from '../texts'
import type { FloaterLayer } from '../ui/FloaterLayer'
import { UI } from '../ui/palette'
import type { FishingScene } from './scenes/FishingScene'
import type { JuiceFx } from './JuiceFx'
import { Minigame, type MinigameResult } from './Minigame'

import type { FightFocus } from './FightFocus'

export interface FightStageDeps {
	game: GameContext
	scene: FishingScene
	juice: JuiceFx
	/** Layer that hosts the minigame view. */
	fightLayer: Container
	/** Layer that lifts the float above the fight. */
	bobberLayer: Container
	/**
	 * Layer that hosts the stamina bars. It sits above the weather, so the bars
	 * stay readable in fog while the ring and the fish are dimmed with the water.
	 */
	barsLayer: Container
	/** Short captions over the ring ("нет сил", "сорвалась"). */
	floaters: FloaterLayer
	focus: FightFocus
}

/** One frame of fight input, already normalized by the round flow. */
export interface FightInput {
	pointerX: number
	pointerY: number
	/** Normalized keyboard pull direction; zero when no key is held. */
	directionX: number
	directionY: number
	held: boolean
}

/**
 * The live fight: owns the {@link Minigame} view for one hooked fish and keeps
 * the scene, float, vignette and reel sound in sync with it. The round flow
 * decides when a fight starts, receives its result and disposes of it.
 */
export class FightStage {
	private readonly game: GameContext
	private readonly scene: FishingScene
	private readonly juice: JuiceFx
	private readonly fightLayer: Container
	private readonly bobberLayer: Container
	private readonly barsLayer: Container
	private readonly floaters: FloaterLayer
	private readonly focus: FightFocus

	private minigame: Minigame | null = null
	/**
	 * Set while the round is stopped by a lesson: the dash frozen at that moment
	 * gets its counter window back on the way out instead of a charged miss.
	 */
	private rechargeOnResume = false

	onFinish?: (result: MinigameResult) => void

	constructor(deps: FightStageDeps) {
		this.game = deps.game
		this.scene = deps.scene
		this.juice = deps.juice
		this.fightLayer = deps.fightLayer
		this.bobberLayer = deps.bobberLayer
		this.barsLayer = deps.barsLayer
		this.floaters = deps.floaters
		this.focus = deps.focus
	}

	/** Touch landing target while the fish is tired. */
	get landingTarget(): { x: number; y: number } | null {
		return this.minigame?.landingTarget ?? null
	}

	/**
	 * Centre of the fight zone in scene coordinates, or `null` when no fight is
	 * live. The round flow anchors its "escaped" caption here: the loss happened
	 * in the ring, so the caption belongs to the ring, not to the angler.
	 */
	get ringCentre(): { x: number; y: number } | null {
		return this.minigame?.ringCenter ?? null
	}

	start(
		fish: FishSpecies,
		weightKg: number,
		pointerX: number,
		pointerY: number,
		held: boolean
	): void {
		this.scene.setFight()
		const castPoint = this.scene.castPoint
		this.juice.trigger('hook', castPoint.x, castPoint.y)
		this.game.audio.hook()
		// A fight can start while the previous reel loop is still fading out.
		this.game.audio.stopReel()

		const minigame = new Minigame(fish, this.game.assets.fish[fish.id], {
			anchor: castPoint,
			// The weight rolled for this catch drives how hard it pulls back.
			weightKg,
			onWarn: () => this.game.audio.warn(),
			onCounter: () => {
				this.game.audio.counter()
				const point = this.scene.bobberPosition
				this.juice.trigger('counter', point.x, point.y)
			},
			onReady: () => {
				this.game.audio.landReady()
				const point = this.scene.bobberPosition
				this.juice.trigger('ready', point.x, point.y)
			},
			onResist: () => this.game.audio.resist(),
			onGripOut: () => {
				this.game.audio.gripOut()
				// The bars empty in silence: a short caption over the scale says why the
				// line went slack for a beat. It rises out of the middle of the gauge —
				// the caption is about that gauge, and spawning it under the bar put it
				// closer to the water than to the thing it explains.
				const gauge = this.minigame?.gaugeCentre ?? castPoint
				this.floaters.add(TEXT.game.gripOut, gauge.x, gauge.y, UI.amber, 9, 1.1, -14)
			}
		})

		this.fightLayer.addChild(minigame)
		// The stamina stack lives above the weather, not inside the fight layer.
		this.barsLayer.addChild(minigame.bars)
		this.bobberLayer.addChild(this.scene.bobberView)
		// Direction cues ride on the float's layer, after the float: the fish's
		// stamina arc is drawn on the float, and the "ПКМ"/heading pointers must
		// never sink under it.
		this.bobberLayer.addChild(minigame.pointers)
		// The lock goes last, on the float's own layer: it is the smallest mark on
		// screen and it seals the float, so it must sit on top of the bobber instead
		// of hiding behind the sprite.
		this.bobberLayer.addChild(minigame.lockMark)
		const ring = minigame.ringCenter
		this.focus.focusAt(ring.x, ring.y)
		minigame.onFinish = (result) => this.onFinish?.(result)
		// The opening frame is painted here, not in the view's constructor: the base
		// constructor cannot call an overridden `update` before its subclass fields
		// exist, and the fight has to be drawn before the first tick.
		minigame.update(0)
		minigame.setHold(held)
		minigame.setPointer(pointerX, pointerY)
		this.scene.setFightFish(
			minigame.fishPoint.x,
			minigame.fishPoint.y,
			minigame.fishVelocity.x,
			minigame.fishVelocity.y
		)
		this.scene.setEscapeMeter(0)
		this.scene.setFishStamina(1)
		this.minigame = minigame
	}

	update(dt: number, input: FightInput): void {
		const minigame = this.minigame
		if (!minigame) return

		this.scene.setPulling(input.held)
		minigame.setPointer(input.pointerX, input.pointerY)
		minigame.setDirection(input.directionX, input.directionY)
		// The cues that belong to the float (direction pointer, counter lock) are
		// drawn on the float's layer, so they need its position, not the fish's.
		const float = this.scene.bobberPosition
		minigame.setFloatPoint(float.x, float.y)
		minigame.setHold(input.held)
		minigame.update(dt)

		const point = minigame.fishPoint
		const velocity = minigame.fishVelocity
		this.scene.setFightFish(point.x, point.y, velocity.x, velocity.y, minigame.isSteering)
		this.scene.setEscapeMeter(minigame.escapeMeter)
		this.scene.setFishStamina(minigame.endurance)
		// The crank strains as the hand fails: the last third of the grip lifts the
		// reel's pitch, so the sound runs out before the bar does.
		this.game.audio.setGrip(minigame.grip)

		// The reel is a sustain: it loops for as long as the player holds the
		// line, and fades out the moment they let go. It also has to go quiet the
		// frame the fight is decided — `settle()` has already released it by then
		// (the catch can be won right here, inside `minigame.update`), so asking a
		// finished fight to start it again would leave the crank running under the
		// whole catch display.
		if (minigame.isRunning && minigame.isSteering) this.game.audio.startReel()
		else this.game.audio.stopReel()
	}

	/** Final pull: RMB/F, or a tap on the fish on touch. */
	finalPull(): void {
		this.minigame?.finalPull()
	}

	/** Where the live counter sector points, or null outside a dash's window. */
	get counterCue(): number | null {
		return this.minigame?.counterCue ?? null
	}

	/** The touch answer to a dash: the stick was pushed at the sector. */
	counterFromStick(angle: number): void {
		this.minigame?.counterFromStick(angle)
	}

	/** Hold to pull; release to rest. */
	setHold(held: boolean): void {
		this.minigame?.setHold(held)
	}

	/**
	 * The cursor in scene pixels.
	 *
	 * The model only learns the cursor from a running tick, so a frame that was
	 * frozen — a pause, a lesson — leaves it holding the last live position. A
	 * press must push the cursor first: the counter's drag is measured from where
	 * the press landed, and an anchor left behind by the previous frame sends the
	 * gesture to the wrong place.
	 */
	setPointer(x: number, y: number): void {
		this.minigame?.setPointer(x, y)
	}

	/**
	 * The round was frozen under a dialog. On the way back, a dash that was live
	 * when the round stopped is not forgiven: the pause must not bank a counter
	 * window (see `FightModel.resumeFromPause`). A lesson of the manual passes
	 * `recharge` on the way in, and the window it froze is handed back instead.
	 */
	setPaused(paused: boolean, recharge = false): void {
		if (paused) {
			this.rechargeOnResume = recharge
			return
		}
		const rechargeWindow = this.rechargeOnResume
		this.rechargeOnResume = false
		this.minigame?.resumeAfterPause(rechargeWindow)
	}

	/** The round is decided: hide the fight view but keep it until the reset. */
	settle(): void {
		if (!this.minigame) return
		this.game.audio.stopReel()
		this.minigame.visible = false
		this.minigame.bars.visible = false
		this.minigame.pointers.visible = false
		this.minigame.setHold(false)
	}

	/** Drop the fight view entirely; the next cast builds a fresh one. */
	dispose(): void {
		this.game.audio.stopReel()
		if (!this.minigame) return
		this.fightLayer.removeChild(this.minigame)
		// The bars and the pointer cues are parented outside the minigame, so they
		// are torn down here rather than by the minigame's own `destroy`.
		this.barsLayer.removeChild(this.minigame.bars)
		this.minigame.bars.destroy({ children: true })
		this.bobberLayer.removeChild(this.minigame.pointers)
		this.minigame.pointers.destroy({ children: true })
		this.minigame.destroy({ children: true })
		this.minigame = null
	}
}

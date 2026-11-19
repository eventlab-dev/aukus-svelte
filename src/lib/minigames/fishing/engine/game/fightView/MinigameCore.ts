import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { FishSpecies } from '../../config'
import { FIGHT_RADIUS } from '../fight'
import { FightModel, type MinigameOptions, type MinigameResult } from '../fight'
import { FISH_SCALE, GAUGE, SILHOUETTE } from './setup'

export abstract class MinigameCore extends Container {
	protected readonly model: FightModel
	protected readonly fishSprite: Sprite
	protected readonly ringG = new Graphics()
	protected readonly counterG = new Graphics()
	/**
	 * Direction cues — the small velocity arrow and the dash telegraph.
	 *
	 * They live in a container of their own so the float layer can put them above
	 * the float: the fish-stamina arc is drawn on the float, and a pointer that
	 * slides under that gauge disappeared exactly when the fish was closest to it.
	 * The landing ring rides here too, for the same reason.
	 */
	readonly pointers = new Container()
	/**
	 * The padlock of a landed counter, on a container of its own.
	 *
	 * It belongs to the float, so the stage re-parents it onto the float's layer
	 * *after* the float and the pointers: the mark has to sit on top of the bobber,
	 * not behind the sprite it is sealing. Until then it simply rides in the fight
	 * layer, which keeps a bare `Minigame` (tests, the F8 preview) complete.
	 */
	readonly lockMark = new Container()
	/** The closing landing-window ring around the tired fish. */
	protected readonly landRing = new Graphics()
	protected readonly directionG = new Graphics()
	protected readonly cueG = new Graphics()
	protected readonly lockG = new Graphics()
	protected readonly barG = new Graphics()
	protected readonly warnG = new Graphics()
	/** 0..1 progress of the closing landing ring; 0 while it is not landable. */
	protected landCue = 0
	/** 0..1 opacity of the landing ring, so it can fade in and out on its own. */
	protected landFade = 0
	protected wasLandable = false
	/**
	 * Where the float is, in scene pixels.
	 *
	 * The fight view draws the fish and the ring, but the float is the scene's
	 * own sprite: the cues that belong to the float (the direction pointer, the
	 * counter lock) have to sit on it, so the stage hands its position over every
	 * frame. Until the first update it falls back to the fish, which is where the
	 * float starts.
	 */
	protected floatPoint = { x: 0, y: 0 }
	/**
	 * The stamina stack, on a container of its own.
	 *
	 * It is deliberately **not** a child of the minigame: the fight layer sits
	 * under the weather, so bars parented here were dimmed by the fog. The screen
	 * parents this container above the fog instead; the drawing code still lives
	 * here, and the bars are drawn in scene coordinates, so nothing else changes.
	 */
	readonly bars = new Container()
	protected intro = 0
	protected introScale = 0

	onFinish?: (result: MinigameResult) => void

	constructor(fish: FishSpecies, icon: Texture, options: MinigameOptions) {
		super()
		this.model = new FightModel(fish, options)
		// The float starts on the hooked fish; the stage corrects this on its first
		// update, and the cues never draw at the origin.
		this.floatPoint = { ...this.model.fishPoint }
		this.eventMode = 'none'

		this.addChild(this.ringG)

		this.fishSprite = new Sprite(icon)
		this.fishSprite.anchor.set(0.5)
		this.fishSprite.scale.set(FISH_SCALE)
		this.fishSprite.alpha = 0
		this.fishSprite.tint = SILHOUETTE
		this.addChild(this.fishSprite)
		this.addChild(this.counterG)

		this.bars.addChild(this.barG)
		this.bars.eventMode = 'none'

		// The landing ring rides above the float with the pointers, so neither the
		// float's gauge nor the fish can hide the one cue that opens the catch.
		this.landRing.eventMode = 'none'

		this.pointers.addChild(this.landRing)
		this.pointers.addChild(this.directionG)
		this.pointers.addChild(this.warnG)
		this.pointers.eventMode = 'none'
		this.lockMark.addChild(this.lockG)
		this.lockMark.eventMode = 'none'
		this.addChild(this.lockMark)
		this.addChild(this.cueG)
		this.model.onFinish = (result) => this.onFinish?.(result)
		// No `this.update(0)` here: it is a virtual call from a base constructor, so
		// it would run before the subclass fields exist (`WarningView`'s two zone
		// clocks among them) and crash on the first hook. `FightStage` paints the
		// opening frame right after the view is built instead.
	}

	get isSteering(): boolean {
		return this.model.isSteering
	}

	/** False once the fight has been decided, whatever the pointer is doing. */
	get isRunning(): boolean {
		return this.model.isRunning
	}

	/** Screen position of the fish silhouette, used by the trailing float. */
	get fishPoint(): { x: number; y: number } {
		return this.model.fishPoint
	}

	/** Current fish velocity, used to trail the float behind the fish. */
	get fishVelocity(): { x: number; y: number } {
		return this.model.fishVelocity
	}

	/** Anchor of the wavy ring, mostly for debugging and screenshots. */
	get ringCenter(): { x: number; y: number } {
		return { x: this.model.centerX, y: this.model.centerY }
	}

	/** True when the fish is tired and inside the circle. */
	get canLand(): boolean {
		return this.model.canLand
	}

	/** 0..1 escape pressure; shown by the sinking float and taut line. */
	get escapeMeter(): number {
		return this.model.escapeMeter
	}

	/** 0..1 fish endurance; shown by the half-ring under the float. */
	get endurance(): number {
		return this.model.enduranceValue
	}

	/** 0..1 angler grip; the reel's pitch climbs in its last third. */
	get grip(): number {
		return this.model.gripValue
	}

	/** Top of the two-row stamina stack, just above the ring. */
	protected get staminaY(): number {
		return this.model.centerY - FIGHT_RADIUS - 26
	}

	/**
	 * Centre of the grip gauge in scene pixels. Captions that explain the scale
	 * («нет сил») belong on it, not under it: they are read as coming out of the
	 * gauge the player is watching, so the stage anchors them here and lets them
	 * rise off the bar.
	 */
	get gaugeCentre(): { x: number; y: number } {
		return {
			x: this.model.centerX,
			y: Math.round(this.staminaY + GAUGE.height / 2)
		}
	}

	/** Screen position of the tired fish, used as the touch landing target. */
	get landingTarget(): { x: number; y: number } | null {
		if (!this.canLand) return null
		const point = this.model.fishPoint
		return { x: point.x, y: point.y }
	}

	/** Hold to pull; release to rest. */
	setHold(held: boolean): void {
		this.model.setHold(held)
	}

	/** The round returned from a pause; a dash frozen by it is not forgiven. */
	resumeAfterPause(): void {
		this.model.resumeFromPause()
	}

	/** Separate final pull: RMB/F, or a tap on the fish. */
	finalPull(): void {
		this.model.finalPull()
	}

	/** Where the live counter sector points, for the touch stick's hint. */
	get counterCue(): number | null {
		return this.model.counterCue
	}

	/** The touch answer to a dash: the stick was pushed at the sector. */
	counterFromStick(angle: number): void {
		this.model.counterFromStick(angle)
	}

	/** Cursor position in screen space; while held it sets the pull direction. */
	setPointer(x: number | null, y: number | null): void {
		this.model.setPointer(x, y)
	}

	/** Scene position of the float, so the pointer and the lock ride on it. */
	setFloatPoint(x: number, y: number): void {
		this.floatPoint.x = x
		this.floatPoint.y = y
	}

	/** Optional keyboard steering direction (normalized by the caller). */
	setDirection(x: number, y: number): void {
		this.model.setDirection(x, y)
	}

	public abstract update(dt: number): void
	protected abstract draw(): void
	protected abstract syncFishVisual(): void
}

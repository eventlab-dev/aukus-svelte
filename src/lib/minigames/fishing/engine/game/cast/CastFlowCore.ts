import { TIMING, VIEW } from '../../config'
import { clamp, randRange } from '../../utils'
import { FightStage } from '../FightStage'
import type { FightFocus } from '../FightFocus'
import type { FloaterLayer } from '../../ui/FloaterLayer'
import type { FishingScene } from '../scenes/FishingScene'
import type { JuiceFx } from '../JuiceFx'
import type { GameContext } from '../../GameContext'
import type { AreaDef } from '../../areas'
import type { FishSpecies } from '../../config'
import type { MinigameResult } from '../fight'
import { type CastFlowDeps, type CastPhase, type PullKey } from './setup'
import { castBand, ringClearsAngler } from '../castSafety'

export abstract class CastFlowCore {
	protected abstract resolveFight(result: MinigameResult): void
	protected abstract earlyHook(): void
	protected abstract hookFish(): void
	protected abstract doCast(): void
	/** Cuts the catch display short, once the landed fish has settled. */
	protected abstract skipCatch(): void

	protected readonly game: GameContext
	protected readonly area: AreaDef
	protected readonly scene: FishingScene
	protected readonly juice: JuiceFx
	protected readonly floaters: FloaterLayer
	protected readonly focus: FightFocus
	protected readonly fight: FightStage

	protected phaseValue: CastPhase = 'idle'
	protected chargeValue = 0
	protected chargeDir = 1
	protected waitTimer = 0
	protected biteTimer = 0
	protected biteWindow = 1
	protected resolveTimer = 0
	protected catchShown = false
	protected pressed = false
	protected paused = false
	/** The rod waits for the round's first note; see `setCastLocked`. */
	protected castLocked = false
	protected chargeSoundTimer = 0
	protected nibblePlayed = false
	protected nibbleLead: number = TIMING.nibbleLeadMax

	protected fish: FishSpecies | null = null
	protected fishWeightKg = 0
	/**
	 * The current fish wears the shiny colourway. Rolled once, at the bite, with
	 * the weight: the reveal, the record and the catch event all read one flag,
	 * so the picture can never disagree with what was written down.
	 */
	protected fishShiny = false
	protected pointerX = VIEW.width / 2
	protected pointerY = VIEW.height / 2
	/** Re-rolled every cast; landing inside it boosts rare fish. */
	protected luckBandCenterValue = 0.75
	protected luckZoneHit = false
	/** Time spent charging; used for the late-release buffer. */
	protected chargeTime = 0
	/** Last moment the charge was inside the zone, in `chargeTime` units. */
	protected lastZoneInside = -Infinity
	/** Whether the previous charging frame was inside the zone, for the tick. */
	protected wasInsideZone = false

	protected tapLanding = false
	protected tapIconX = 0
	protected tapIconY = 0
	/**
	 * Touch stick: held means "pulling", the vector is the pull direction. Both
	 * stay zero on a mouse, where the pointer and the button do the same job.
	 */
	protected stickX = 0
	protected stickY = 0
	/**
	 * Where the cast is aimed on a touch screen.
	 *
	 * A phone has no cursor over the water, so the spot is picked from the area's
	 * own water band when the charge starts: the throw is random, and the power
	 * still decides how far along that line the float lands. On a mouse the aim is
	 * the pointer and these two are never read.
	 */
	protected aimX = VIEW.width / 2
	protected aimY = VIEW.height / 3
	protected readonly pullKeys = new Set<PullKey>()

	constructor(deps: CastFlowDeps) {
		this.game = deps.game
		this.area = deps.area
		this.scene = deps.scene
		this.juice = deps.juice
		this.floaters = deps.floaters
		this.focus = deps.focus
		this.fight = new FightStage({
			game: deps.game,
			scene: deps.scene,
			juice: deps.juice,
			fightLayer: deps.fightLayer,
			bobberLayer: deps.bobberLayer,
			barsLayer: deps.barsLayer,
			floaters: deps.floaters,
			focus: deps.focus
		})
		this.fight.onFinish = (result) => this.resolveFight(result)

		this.scene.onCastLanded = () => {
			this.game.audio.plop()
			if (this.luckZoneHit) this.scene.celebrateLuck()
			const point = this.scene.castPoint
			this.juice.trigger('cast', point.x, point.y)
		}
	}

	// -------------------------------------------------------------- public API

	get phase(): CastPhase {
		return this.phaseValue
	}

	/** 0..1 cast power while charging. */
	get charge(): number {
		return this.chargeValue
	}

	/** Centre of the luck zone on the power bar, 0..1. */
	get luckBandCenter(): number {
		return this.luckBandCenterValue
	}

	/**
	 * The touch landing button is live: the fish is tired and inside the ring.
	 * The button is the whole control on a phone — the fish itself is a target a
	 * thumb cannot reach without covering the ring it has to be read on.
	 */
	get landingReady(): boolean {
		return this.phaseValue === 'fighting' && !this.paused && this.fight.landingTarget !== null
	}

	/** Where the stick should be pushed to answer the live dash, if any. */
	get counterCue(): number | null {
		if (this.phaseValue !== 'fighting' || this.paused) return null
		return this.fight.counterCue
	}

	/**
	 * Centre of the live fight ring in scene pixels, or `null` when nothing is
	 * hooked. The lesson note is placed around the fight, so it needs to know
	 * where the fight stands on the frozen frame.
	 */
	get fightCentre(): { x: number; y: number } | null {
		if (this.phaseValue !== 'fighting') return null
		return this.fight.ringCentre
	}

	/**
	 * Holds the rod back until the round has taught its own cast.
	 *
	 * The «ЗАБРОС» note lands half a second into the round, once the grid wipe has
	 * finished; a player who pressed inside that half-second started a charge, the
	 * round left `idle`, and the lesson never opened — the first cast of the
	 * session went by unexplained. The owner drops the lock the moment the note
	 * takes the round (see `GameOverlays.openLesson`), so the press that closes
	 * the note is also the press that casts.
	 */
	setCastLocked(locked: boolean): void {
		this.castLocked = locked
	}

	/**
	 * The bite waits to be struck: the float is under and the window has not been
	 * answered yet. On touch the stick itself lights up — its press is the strike.
	 */
	get hookReady(): boolean {
		return this.phaseValue === 'bite' && !this.paused
	}

	/** Where a release aims: the picked spot on a phone, the pointer on a mouse. */
	protected castAim(): { x: number; y: number } {
		return this.game.touch ? { x: this.aimX, y: this.aimY } : { x: this.pointerX, y: this.pointerY }
	}

	/**
	 * Picks the cast's spot for this throw, somewhere in the area's water band.
	 *
	 * The band alone is not enough: it is a rectangle over painted water, so a
	 * blind point inside it can sit on the bank or right under the angler's feet,
	 * where the fight ring has nowhere to stand. The pick therefore takes the same
	 * two rules the real cast has to pass — open water and a ring that clears the
	 * angler — and falls back to the band's middle if the table cannot satisfy
	 * them (a broken area edit, caught by the cast's own safety search).
	 */
	protected pickTouchAim(): void {
		// The band the ring can be played in, not the authored one: a point under
		// the sky rail is water nobody can fish, and the pick exists to choose a
		// spot the cast could really have.
		const band = castBand(this.area.layout)
		const angler = this.area.layout.angler
		for (let attempt = 0; attempt < 12; attempt += 1) {
			const x = randRange(band.minX, band.maxX)
			const y = randRange(band.minY, band.maxY)
			if (!this.scene.isWaterAt(x, y)) continue
			if (!ringClearsAngler(x, y, angler)) continue
			this.aimX = x
			this.aimY = y
			return
		}
		this.aimX = (band.minX + band.maxX) / 2
		this.aimY = (band.minY + band.maxY) / 2
	}

	/**
	 * Alpha of the "ready to cast" prompt. It sits at 1 while idle, fades in
	 * over the dissolving catch at the tail of a successful round, and is 0
	 * otherwise.
	 */
	get castPromptAlpha(): number {
		if (this.paused) return 0
		if (this.phaseValue === 'idle') return 1
		if (this.phaseValue !== 'resolve' || !this.catchShown) return 0
		return clamp(1 - this.resolveTimer / TIMING.catchCrossfade, 0, 1)
	}

	/**
	 * Freezes the round under a dialog.
	 *
	 * `recharge` marks the manual's own pause — the lesson stops the fight to
	 * teach the dash it is standing on, so that dash keeps its counter window for
	 * the way back instead of being charged as a miss.
	 */
	setPaused(paused: boolean, recharge = false): void {
		this.paused = paused
		// The fight keeps its state across the pause, but a dash that was live when
		// the player paused is settled on the way back instead of waiting frozen in
		// the menu (see `FightStage.setPaused`).
		this.fight.setPaused(paused, recharge)
		if (!paused) return
		this.game.audio.stopReel()
		this.game.audio.stopCharge()
		this.pressed = false
		this.scene.setPulling(false)
		this.pullKeys.clear()
		this.fight.setHold(false)
		// The charge and the cast are reaction windows, so freezing them under a
		// pause menu let the player line up the luck zone and the bite for free.
		// The fight is continuous and stays paused, but its own windows are
		// settled on resume for the same reason.
		if (
			this.phaseValue === 'charging' ||
			this.phaseValue === 'waiting' ||
			this.phaseValue === 'bite'
		) {
			this.cancelCastOnPause()
		}
	}

	/** Drops the in-flight charge/cast and returns the round to idle. */
	protected cancelCastOnPause(): void {
		this.phaseValue = 'idle'
		this.chargeValue = 0
		this.chargeDir = 1
		this.chargeSoundTimer = 0
		this.chargeTime = 0
		this.lastZoneInside = -Infinity
		this.wasInsideZone = false
		this.luckZoneHit = false
		this.nibblePlayed = false
		this.waitTimer = 0
		this.biteTimer = 0
		this.pressed = false
		this.tapLanding = false
		this.catchShown = false
		this.fish = null
		this.fishWeightKg = 0
		this.fishShiny = false
		this.pullKeys.clear()
		this.scene.setPulling(false)
		this.scene.resetCast()
	}
}

import { LUCK_BAND, LUCK_RELEASE_BUFFER, PASS_BY_CHANCE, SPOOK_HOLD, TIMING } from '../../config'
import { TEXT } from '../../texts'
import { clamp } from '../../utils'
import { chance, randRange } from '../../utils'
import { formatWeight, rollFishWeight, weightScale } from '../../fishWeight'
import { UI } from '../../ui/palette'
import { pickCastFish } from '../castPick'
import type { MinigameResult } from '../fight'
import type { FishSpecies } from '../../config'
import { CastFlowInput } from './CastFlowInput'
import { CATCH_LABEL_GAP, HOOK_SHAKE } from './setup'

export class CastFlowState extends CastFlowInput {
	update(dt: number): void {
		if (this.paused) return

		this.focus.update(dt, this.phaseValue === 'fighting')
		this.updateCatchCrossfade()

		if (this.phaseValue === 'charging') {
			this.updateCharge(dt)
		} else if (this.phaseValue === 'waiting') {
			this.waitTimer -= dt
			if (this.waitTimer <= this.nibbleLead && !this.nibblePlayed) {
				this.nibblePlayed = true
				this.scene.showNibble()
				this.game.audio.nibble()
			}
			if (this.waitTimer <= 0) this.beginBite()
		} else if (this.phaseValue === 'bite') {
			if (this.pressed) {
				// The stick was already in hand when the fish took the bait: holding it
				// is the strike. A held control cannot produce the press the mouse
				// makes, and a thumb that was on the stick a moment early would
				// otherwise lose the fish without ever having done anything.
				this.hookFish()
			} else {
				this.biteTimer -= dt
				if (this.biteTimer <= 0) {
					this.failCast(TEXT.game.missedHook, this.aboveFloat())
				}
			}
		} else if (this.phaseValue === 'fighting') {
			const keys = this.readPullDirection()
			// Keys win, then the touch stick. With neither set the model falls back to
			// the pointer, which is how a mouse aims.
			const steering = keys.x !== 0 || keys.y !== 0 ? keys : { x: this.stickX, y: this.stickY }
			this.fight.update(dt, {
				pointerX: this.pointerX,
				pointerY: this.pointerY,
				directionX: steering.x,
				directionY: steering.y,
				held: this.pressed
			})
		} else if (this.phaseValue === 'resolve') {
			this.resolveTimer -= dt
			if (this.resolveTimer <= 0) this.advanceCast()
		}
	}

	/**
	 * The power bar is a reaction window as well: one 0.1 s frame at 10 fps would
	 * move it straight across the release band. Integrate it in fixed slices so a
	 * slow frame cannot skip the zone the bar was actually in.
	 */
	private updateCharge(dt: number): void {
		let left = dt
		while (left > 0) {
			const part = Math.min(left, 1 / 60)
			left -= part
			this.advanceCharge(part)
		}
		this.chargeSoundTimer -= dt
		if (this.chargeSoundTimer <= 0) {
			this.game.audio.startCharge()
			this.game.audio.setCharge(this.chargeValue)
			this.chargeSoundTimer = 0.1
		}
	}

	private advanceCharge(part: number): void {
		this.chargeValue += (this.chargeDir * part) / TIMING.chargeCycle
		if (this.chargeValue >= 1) {
			this.chargeValue = 1
			this.chargeDir = -1
		} else if (this.chargeValue <= 0) {
			this.chargeValue = 0
			this.chargeDir = 1
		}
		this.chargeTime += part
		const inside = Math.abs(this.chargeValue - this.luckBandCenterValue) <= LUCK_BAND.width / 2
		if (inside) {
			this.lastZoneInside = this.chargeTime
			if (!this.wasInsideZone) {
				// No cue here any more: the zone is confirmed by the completion chime
				// when the cast actually leaves the hand. The haptic stays — it is a
				// touch hint, not the cast's reward.
				if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
					navigator.vibrate(8)
				}
			}
		}
		this.wasInsideZone = inside
	}

	// ------------------------------------------------------------- cast flow
	protected doCast(): void {
		if (this.phaseValue !== 'charging') return
		this.phaseValue = 'waiting'
		this.chargeValue = clamp(this.chargeValue)
		const insideNow = Math.abs(this.chargeValue - this.luckBandCenterValue) <= LUCK_BAND.width / 2
		this.luckZoneHit = insideNow || this.chargeTime - this.lastZoneInside <= LUCK_RELEASE_BUFFER
		// The cue releases the wind-up itself: stopping it here would cut the loop
		// off before the whoosh had a chance to take it over.
		this.game.audio.cast()
		if (this.luckZoneHit) {
			// A cast that came out of the luck band is confirmed over the whoosh by
			// the completion chime alone.
			this.game.audio.objective()
		}
		// The cursor at the moment of release is the cast's direction; the charge
		// is how far along it the float lands. On a phone there is no cursor: the
		// spot was picked when the charge started.
		this.scene.playCast(this.chargeValue, this.castAim())
		this.game.clock.persist()
		this.waitTimer = randRange(TIMING.waitMin, TIMING.waitMax)
		this.nibbleLead = randRange(TIMING.nibbleLeadMin, TIMING.nibbleLeadMax)
		this.chargeSoundTimer = 0
		this.nibblePlayed = false
	}

	protected beginBite(): void {
		if (chance(PASS_BY_CHANCE)) {
			this.passBy()
			return
		}
		const clock = this.game.clock
		const fish = pickCastFish({
			areaId: this.area.id,
			minutes: clock.minutes,
			weather: clock.weatherFor(this.area.id),
			weatherDef: clock.weatherDefFor(this.area.id),
			luckZoneHit: this.luckZoneHit
		})
		this.fish = fish
		this.fishWeightKg = rollFishWeight(fish)
		this.phaseValue = 'bite'
		this.biteWindow = Math.max(0.62, 0.95 - fish.speed * 0.25)
		this.biteTimer = this.biteWindow
		this.scene.showBite()
		this.game.audio.bite()
		// The catch itself: the float goes under and the camera takes the knock.
		// The player's strike a moment later is a deliberate move and stays still.
		const bobber = this.scene.bobberPosition
		this.juice.trigger('bite', bobber.x, bobber.y)
	}

	protected hookFish(): void {
		if (!this.fish || this.phaseValue !== 'bite') return
		this.phaseValue = 'fighting'
		this.pullKeys.clear()
		// The strike is felt before the fight starts: the frame takes a knock in
		// proportion to what is on the hook.
		const bobber = this.scene.bobberPosition
		this.juice.trigger('hook', bobber.x, bobber.y, HOOK_SHAKE[this.fish.tier])
		this.fight.start(this.fish, this.fishWeightKg, this.pointerX, this.pointerY, this.pressed)
	}

	/** A too-early hook: the fish bolts and the cast is returned. */
	protected earlyHook(): void {
		if (this.phaseValue !== 'waiting') return
		this.phaseValue = 'resolve'
		this.resolveTimer = SPOOK_HOLD
		this.pressed = false
		this.scene.escapeFish()
		this.game.audio.escape()
		this.addFloater(TEXT.game.earlyHook, UI.rose, 12, 1.2, -24, this.aboveFloat())
	}

	/** The fish inspected the bait and moved on; keep the bobber and wait. */
	protected passBy(): void {
		this.fishWeightKg = 0
		this.phaseValue = 'waiting'
		this.pressed = false
		this.waitTimer = randRange(TIMING.waitMin * 0.65, TIMING.waitMax * 0.85)
		this.nibbleLead = randRange(TIMING.nibbleLeadMin, TIMING.nibbleLeadMax)
		this.nibblePlayed = false
		this.game.audio.nibble()
	}

	protected resolveFight(result: MinigameResult): void {
		if (this.phaseValue !== 'fighting' || !this.fish) return
		// Captured before the fight view is hidden: the lost-fish caption has to
		// sit over the ring the fish just escaped from, which only exists while
		// the minigame does.
		const ring = this.fight.ringCentre
		this.scene.restoreBobber()
		const fish = this.fish

		if (!result.won) {
			this.failCast(TEXT.game.lostFish, ring ?? this.aboveFloat())
			return
		}

		const firstCatch = this.game.progress.recordCatch(fish.id, this.fishWeightKg)

		this.phaseValue = 'resolve'
		this.resolveTimer = TIMING.resultHold
		this.catchShown = true
		this.pressed = false
		this.pullKeys.clear()

		this.fight.settle()
		const catchTop = this.scene.catchFish(
			this.game.assets.fish[fish.id],
			1.15 * weightScale(fish, this.fishWeightKg),
			fish.tier
		)
		const splash = this.scene.bobberPosition
		this.juice.trigger('catch', splash.x, splash.y)
		this.game.audio.catchFish()
		if (fish.tier === 'legendary') this.game.audio.ready()
		this.showCatchFeedback(fish, firstCatch, catchTop)

		this.game.handleCatch({
			fishId: fish.id,
			areaId: this.area.id,
			weightKg: this.fishWeightKg,
			firstCatch,
			at: Date.now()
		})
	}

	/**
	 * Ends the round with a red caption.
	 *
	 * Every failure used to be printed over the angler's head, which put "не
	 * успел подсeчь" a hand's width away from the float that actually got away
	 * and made the caption read as something the fisherman said. The caption now
	 * goes where the event happened: over the float for a missed bite, over the
	 * fight ring for a fish that tore off.
	 */
	protected failCast(reason: string, at: { x: number; y: number }): void {
		this.catchShown = false
		this.scene.restoreBobber()
		this.phaseValue = 'resolve'
		this.resolveTimer = TIMING.escapedHold
		this.pressed = false
		this.pullKeys.clear()
		this.scene.escapeFish()
		const splash = this.scene.bobberPosition
		this.juice.trigger('escape', splash.x, splash.y)
		this.game.audio.escape()
		this.fight.settle()
		this.addFloater(reason.replace(TEXT.common.ellipsis, ''), UI.rose, 12, 1.3, -24, at)
	}

	/**
	 * Caption spot just above the float, clear of the bite mark that sits on the
	 * same point and about as tall as two lines of this text.
	 */
	protected aboveFloat(): { x: number; y: number } {
		const bobber = this.scene.bobberPosition
		return { x: bobber.x, y: bobber.y - 16 }
	}

	protected advanceCast(): void {
		this.catchShown = false
		this.scene.restoreBobber()
		this.fight.dispose()
		this.fish = null
		this.fishWeightKg = 0
		this.scene.resetCast()
		this.pullKeys.clear()
		this.chargeValue = 0
		this.chargeSoundTimer = 0
		this.nibblePlayed = false
		this.phaseValue = 'idle'
		// The catch's name tag belongs to the catch: when the display is skipped it
		// would otherwise outlive the round and hang over the next cast's water.
		this.floaters.clear()
	}

	/**
	 * Cuts the catch display short on the player's click.
	 *
	 * The round's payoff is the fish arcing out of the water into the angler's
	 * hands, so the jump is not skippable: a click while it is still flying would
	 * throw away the one shot the whole cast was for. What can be cut is the hold
	 * after the landing, and only down to the crossfade that ends the round — the
	 * fish still dissolves instead of blinking out of the fisherman's hands.
	 */
	protected skipCatch(): void {
		if (this.phaseValue !== 'resolve' || !this.catchShown) return
		const landed = TIMING.resultHold - TIMING.catchJump
		if (this.resolveTimer > landed) return
		this.resolveTimer = Math.min(this.resolveTimer, TIMING.catchCrossfade)
		// The name tag fades out with the fish instead of staying at full strength
		// until the round changes under it.
		this.floaters.fadeOut(TIMING.catchCrossfade)
	}

	// ------------------------------------------------------------------- FX

	/** Fade the held fish while the idle cast prompt comes back in. */
	protected updateCatchCrossfade(): void {
		if (this.phaseValue !== 'resolve' || !this.catchShown) return
		const fade = clamp(1 - this.resolveTimer / TIMING.catchCrossfade, 0, 1)
		if (fade > 0) this.scene.setHeldFishAlpha(1 - fade)
	}

	/**
	 * Name tag for the landed fish. It is anchored to the catch itself (not to a
	 * per-area point), so it always hugs the top of the light around the fish and
	 * stays centred over the angler. `catchTop` is the top of that light rather
	 * than the top of the sprite, which keeps the tag out of the rays.
	 */
	protected showCatchFeedback(fish: FishSpecies, firstCatch: boolean, catchTop: number): void {
		const text = TEXT.game.catchFeedback(fish.name, formatWeight(this.fishWeightKg))
		this.addFloater(
			firstCatch ? `${text}\n${TEXT.game.newSpecies}` : text,
			// Same ice-white as the "ЗАБРОС / ЛКМ" prompt: the catch label belongs to
			// the same interface voice, not to the semantic colour set.
			UI.text,
			13,
			// It ends when the round does, so the last visible frame of the catch is
			// the fish with its tag over it, not a lonely caption over empty water.
			TIMING.resultHold - TIMING.catchJump,
			0,
			{
				x: this.area.layout.angler.x,
				y: catchTop - CATCH_LABEL_GAP
			},
			// The tag waits until the fish has finished its arc into the angler's
			// hands: during the jump the name would hang over open water.
			TIMING.catchJump
		)
	}

	protected addFloater(
		value: string,
		color: number,
		size: number,
		life: number,
		vy: number,
		at: { x: number; y: number },
		delay = 0
	): void {
		this.floaters.add(value, at.x, at.y, color, size, life, vy, 0.5, delay)
	}
}

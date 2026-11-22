import {
	LUCK_BAND,
	LUCK_RELEASE_BUFFER,
	LUCK_ZONE_SHINY,
	PASS_BY_CHANCE,
	PEARL,
	SPOOK_HOLD,
	TIMING,
	type FishSpecies
} from '../../config'
import { TEXT } from '../../texts'
import { clamp } from '../../utils'
import { chance, randRange } from '../../utils'
import {
	formatFlaw,
	formatPearlSize,
	PEARL_BY_ID,
	rollPearl,
	type PearlCatch
} from '../../fish/pearls'
import { SHELL_SPECIES, isShell } from '../../fish/shell'
import { TIER_SHINY } from '../../fish/tiers'
import { formatWeight, rollFishWeight, weightScale } from '../../fishWeight'
import { UI } from '../../ui/palette'
import { pickCastFish } from '../castPick'
import type { MinigameResult } from '../fight'
import { CastFlowInput } from './CastFlowInput'
import { CATCH_LABEL_GAP, HOOK_SHAKE } from './setup'
import type { ProgressSnapshot } from '../../types'

/** Species already landed, as the roll wants them: a set it can ask once. */
function caughtSpecies(snapshot: ProgressSnapshot): ReadonlySet<string> {
	const ids = new Set<string>()
	for (const [id, entry] of Object.entries(snapshot.fish)) {
		if (entry.caught > 0) ids.add(id)
	}
	return ids
}

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
		const snapshot = this.game.progress.snapshot
		// The shell can be hooked on any water body. It is a rare alternative to
		// the area's own roster, rolled before the fish so the same bite cannot
		// produce both.
		const fish = chance(PEARL.shellChance)
			? SHELL_SPECIES
			: pickCastFish({
					areaId: this.area.id,
					minutes: clock.minutes,
					weather: clock.weatherFor(this.area.id),
					luckZoneHit: this.luckZoneHit,
					catchesOnLocation: snapshot.areaCatches[this.area.id] ?? 0,
					caught: caughtSpecies(snapshot)
				})
		this.fish = fish
		this.fishWeightKg = rollFishWeight(fish)
		// The colourway is rolled with the weight and only for real fish: the
		// shell carries a pearl and has no coat to shine. The odds belong to the
		// rarity class, and the luck zone doubles them.
		const shinyChance = TIER_SHINY[fish.tier] * (this.luckZoneHit ? LUCK_ZONE_SHINY : 1)
		this.fishShiny = !isShell(fish.id) && chance(shinyChance)
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

		// A shell is the carrier of a pearl; the pearl is rolled only after the
		// shell is actually landed, so a torn-off shell costs the cast and nothing
		// else. A luck-zone cast keeps the better of two flaws.
		const pearl = isShell(fish.id) ? rollPearl({ luckZoneHit: this.luckZoneHit }) : null
		const firstCatch = pearl
			? this.game.progress.recordPearl(pearl)
			: this.game.progress.recordCatch(this.area.id, fish.id, this.fishWeightKg, this.fishShiny)
		this.presentCatch(fish, firstCatch, pearl)
	}

	/**
	 * The one catch presentation, shared by a normal fish and the shell.
	 *
	 * The shell gets its own, longer hold: the opening sequence runs inside it,
	 * and the tag waits for the pearl instead of naming the shell. `firstCatch`
	 * means the first find for a pearl and the first catch for a fish.
	 */
	private presentCatch(fish: FishSpecies, firstCatch: boolean, pearl: PearlCatch | null): void {
		this.phaseValue = 'resolve'
		this.resolveTimer = pearl ? PEARL.resultHold : TIMING.resultHold
		this.catchShown = true
		this.pressed = false
		this.pullKeys.clear()

		this.fight.settle()
		const texture = pearl ? this.game.assets.fish.shell : this.game.assets.fish[fish.id]
		const scale = pearl ? 1.15 : 1.15 * weightScale(fish, this.fishWeightKg)
		// The split is the moment the pearl exists; the bloom and the chime belong
		// to it rather than to the shell that only carried it.
		this.scene.onPearlReveal = pearl
			? () => {
					const point = this.scene.bobberPosition
					this.juice.trigger('catch', point.x, point.y)
					this.game.audio.objective()
				}
			: undefined
		const catchTop = this.scene.catchFish(texture, scale, fish.tier, pearl, this.fishShiny)
		const splash = this.scene.bobberPosition
		this.juice.trigger('catch', splash.x, splash.y)
		this.game.audio.catchFish()
		// One "this one is special" chime for both rarities: a mythic tier and a
		// shiny coat. Two calls would overlap the same sample.
		if (fish.tier === 'mythic' || this.fishShiny) this.game.audio.ready()
		if (pearl) this.showPearlFeedback(pearl, firstCatch, catchTop)
		else this.showCatchFeedback(fish, firstCatch, catchTop, this.fishShiny)

		this.game.handleCatch({
			kind: pearl ? 'shell' : 'fish',
			fishId: fish.id,
			areaId: this.area.id,
			weightKg: this.fishWeightKg,
			firstCatch,
			shiny: this.fishShiny,
			at: Date.now(),
			pearl: pearl
				? {
						pearlId: pearl.id,
						float: pearl.float,
						seed: pearl.seed,
						sizeMm: pearl.sizeMm,
						grade: pearl.grade,
						firstFind: firstCatch
					}
				: undefined
		})
	}

	/**
	 * Dev-only: runs the real shell presentation and progress path without a
	 * fight, so the reveal can be checked at a chosen flaw. Never active in a
	 * production build.
	 */
	debugCatchPearl(float = 0.0123): boolean {
		if (!import.meta.env.DEV || this.paused || this.phaseValue !== 'idle') return false
		const pearl = rollPearl({ float })
		const firstFind = this.game.progress.recordPearl(pearl)
		this.fish = SHELL_SPECIES
		this.fishWeightKg = rollFishWeight(SHELL_SPECIES)
		// A shell has no colourway: the pearl is the reveal.
		this.fishShiny = false
		this.scene.restoreBobber()
		this.presentCatch(SHELL_SPECIES, firstFind, pearl)
		return true
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
		this.scene.onPearlReveal = undefined
		this.scene.restoreBobber()
		this.fight.dispose()
		this.fish = null
		this.fishWeightKg = 0
		this.fishShiny = false
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
		// The landing is part of the catch; a shell adds its whole reveal to that.
		// The scene owns the exact moment, because it is the one running it.
		if (!this.scene.catchSkipReady) return
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
	protected showCatchFeedback(
		fish: FishSpecies,
		firstCatch: boolean,
		catchTop: number,
		shiny = false
	): void {
		const lines = [TEXT.game.catchFeedback(fish.name, formatWeight(this.fishWeightKg))]
		if (firstCatch) lines.push(TEXT.game.newSpecies)
		// The coat is the rarest thing about the catch, so it is named under the
		// species rather than left to the shimmer alone: the player has to learn
		// that the rainbow is a catch, not the light of the tier.
		if (shiny) lines.push(TEXT.game.shinyCatch)
		this.addFloater(
			lines.join('\n'),
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

	/**
	 * Name tag for the pearl. It is queued at the catch but delayed past the
	 * reveal, so the first frame of the tag is the first frame of the pearl; the
	 * reveal's own timings set both the delay and the remaining life.
	 */
	protected showPearlFeedback(pearl: PearlCatch, firstFind: boolean, catchTop: number): void {
		const species = PEARL_BY_ID[pearl.id]
		const body = TEXT.game.pearlFeedback(
			species.name,
			formatFlaw(pearl.float),
			formatPearlSize(pearl.sizeMm)
		)
		this.addFloater(
			firstFind ? `${body}\n${TEXT.game.newPearl}` : body,
			UI.text,
			13,
			PEARL.resultHold - TIMING.catchJump - PEARL.revealLead,
			0,
			{
				x: this.area.layout.angler.x,
				y: catchTop - CATCH_LABEL_GAP
			},
			TIMING.catchJump + PEARL.revealLead
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

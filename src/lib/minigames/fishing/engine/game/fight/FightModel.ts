import { FIGHT, type FishSpecies } from '../../config'
import type { Temperament } from '../../types'
import { clamp } from '../../utils'
import { angleDelta } from './angles'
import { BubbleField } from './bubbles'
import { FIGHT_RADIUS, MAX_SPEED, PULL_ACCEL, TAU } from './constants'
import { createFightState } from './createState'
import { FightCounter } from './counter'
import { pullVector, applyDirection, applyHold, applyPointer } from './input'
import { FightPace } from './pace'
import { resumeFightAfterPause } from './pause'
import { updateZone } from './zone'
import { FightMotion } from './motion'
import { FightStamina } from './stamina'
import type { FightState } from './state'
import { zoneTuning } from './zoneTuning'
import type { Bubble, MinigameOptions, MinigameResult } from './types'

/**
 * The ring-fight simulation, with no rendering attached.
 *
 * Holding the button tires the fish and spends grip; releasing rests both. Aim
 * with the cursor or a direction key. Bubbles warn about a burst, and resting
 * first then pulling against it lands the counter; a tired fish inside the
 * circle is landed by a separate final pull. A spent grip refuses all three
 * until the lockout ends. The model is pure, so `simulate-fight.ts` replays the
 * same rules headlessly.
 */
export class FightModel {
	private readonly state: FightState
	private readonly motion: FightMotion
	private readonly stamina: FightStamina
	private readonly counter: FightCounter
	private readonly bubbleField: BubbleField
	private readonly pace = new FightPace()

	constructor(fish: FishSpecies, options: MinigameOptions) {
		const state = createFightState(fish, options)
		this.state = state
		this.bubbleField = new BubbleField(state)
		this.motion = new FightMotion(state, this.bubbleField)
		this.stamina = new FightStamina(state)
		this.counter = new FightCounter(state)
		// The grab is open for exactly as long as the zone is painted.
		this.motion.onZoneStart = (delay) => this.counter.openWindow(zoneTuning.truthTime, delay)

		state.lastAngle = Math.random() * TAU
		state.escapeAngle = state.lastAngle
		this.motion.nextMove()
	}

	get centerX(): number {
		return this.state.centerX
	}

	get centerY(): number {
		return this.state.centerY
	}

	get result(): MinigameResult | null {
		return this.state.finishResult
	}

	get onFinish(): ((result: MinigameResult) => void) | undefined {
		return this.state.onFinish
	}

	set onFinish(handler: ((result: MinigameResult) => void) | undefined) {
		this.state.onFinish = handler
	}

	get isRunning(): boolean {
		return this.state.running
	}

	/** True while the player is actively steering; drives the reel sound. */
	get isSteering(): boolean {
		return this.state.steeringNow
	}

	get time(): number {
		return this.state.elapsed
	}

	get fishOffset(): { x: number; y: number } {
		return { x: this.state.fishX, y: this.state.fishY }
	}

	/** Screen position of the fish silhouette, used by the trailing float. */
	get fishPoint(): { x: number; y: number } {
		return {
			x: this.state.centerX + this.state.fishX,
			y: this.state.centerY + this.state.fishY
		}
	}

	/** Current fish velocity, used to trail the float behind the fish. */
	get fishVelocity(): { x: number; y: number } {
		return { x: this.state.vx, y: this.state.vy }
	}

	get enduranceValue(): number {
		return this.state.endurance
	}

	get gripValue(): number {
		return this.state.grip
	}

	get isGripLocked(): boolean {
		return this.state.gripLock > 0
	}

	/**
	 * True while the angler still has strength to act on the line: a spent grip
	 * takes the reel, the grab and the last pull for the whole lockout. The gauge
	 * wears a padlock for that window, so the refusal is visible.
	 */
	get canAct(): boolean {
		return this.state.gripLock <= 0 && this.state.grip > 0
	}

	get hasAdvantage(): boolean {
		return this.state.advantage > 0
	}

	get isReady(): boolean {
		return this.state.ready
	}

	get isOutside(): boolean {
		return this.state.outside
	}

	/** 0..1 escape meter; 1 means the fish has torn free. */
	get escapeMeter(): number {
		return clamp(this.state.outsideTimer / this.state.escapeHold, 0, 1)
	}

	/**
	 * 0..1 total escape pressure: the clock that has been poured in plus the
	 * share a missed dash still owes it (`escapeFill`). The срыв bar draws the
	 * difference between the two as the incoming part, so a miss reads as a
	 * segment arriving instead of the whole bar jumping.
	 */
	get escapeRisk(): number {
		const s = this.state
		return clamp((s.outsideTimer + s.escapeFill) / s.escapeHold, 0, 1)
	}

	/** Seconds of escape clock still to pour in from missed dashes. */
	get escapePending(): number {
		return this.state.escapeFill
	}

	get warn(): number {
		return this.state.warnTime
	}

	get warnHeading(): number {
		return this.state.warnAngle
	}

	/** True while a feinting dash is still hiding its true heading. */
	get isFeint(): boolean {
		return this.state.feintActive
	}

	/** True once the false lunge has turned into the real dash. */
	get feintRevealed(): boolean {
		return this.state.feintHasRevealed
	}

	/** The heading the counter should oppose, and the feint's own flash heading. */
	get counterHeading(): number {
		return this.state.escapeAngle
	}

	get turnHeading(): number {
		return this.state.escapeAngle
	}

	get turnFlash(): number {
		return this.state.turnFlashValue
	}

	get counterFlashValue(): number {
		return this.state.counterFlash
	}

	/** Seconds left in the counter window; the view invites the grab while > 0. */
	get counterOpen(): number {
		return this.state.counterWindow
	}

	/** Remaining stun time after a successful counter. */
	get stunValue(): number {
		return this.state.stun
	}

	get bubbles(): readonly Bubble[] {
		return this.state.bubbles
	}

	get temperament(): Temperament {
		return this.state.temperament
	}

	get escapeHold(): number {
		return this.state.escapeHold
	}

	/** True when the fish is tired and inside the circle. */
	get canLand(): boolean {
		return this.state.running && this.state.ready
	}

	/** Hold to pull; release to rest. */
	setHold(held: boolean): void {
		applyHold(this.state, held)
	}

	/** Separate final pull: RMB/F, or a tap on the tired fish. */
	finalPull(): void {
		const s = this.state
		if (!s.running || s.finalCooldown > 0 || !this.canAct) return
		s.finalCooldown = FIGHT.resistCooldown

		const inside = Math.hypot(s.fishX, s.fishY) <= FIGHT_RADIUS
		if (s.endurance <= FIGHT.landThreshold && inside) {
			this.finish(true)
			return
		}

		// Too early: the fish tears away and costs grip.
		s.endurance = clamp(s.endurance + FIGHT.resistEndurance)
		s.grip = clamp(s.grip - FIGHT.resistGrip)
		s.escapeAngle = this.fishAngle() + (Math.random() - 0.5) * 0.6
		this.motion.bolt(0.45)
		s.onResist?.()
	}

	/** Cursor position in screen space; while held it sets the pull direction. */
	setPointer(x: number | null, y: number | null): void {
		applyPointer(this.state, x, y)
	}

	/** Optional keyboard steering direction (normalized by the caller). */
	setDirection(x: number, y: number): void {
		applyDirection(this.state, x, y)
	}

	/**
	 * Where the live counter sector points, in radians, or null when no window is
	 * open. The touch stick mirrors it on its own pad, which is how the gesture is
	 * taught without a line of tutorial text.
	 */
	get counterCue(): number | null {
		const s = this.state
		if (!s.running || s.counterUsed || s.counterWindow <= 0) return null
		return s.counterAngle
	}

	/**
	 * The touch answer to a dash: the stick was pushed at it.
	 *
	 * It is recorded here and read by the counter on the next tick, where the
	 * window, the grip and the heading are all known — the control cannot decide
	 * any of that, it only reports which way the thumb went.
	 */
	counterFromStick(angle: number): void {
		if (!this.state.running) return
		this.state.stickGrabAngle = angle
	}

	/**
	 * Advance the fight by `dt` in fixed 1/60 s slices: the headless oracle sees
	 * the same sequence as the browser, and a slow frame is caught up in steps
	 * instead of handing the whole delta to the integrator.
	 */
	update(dt: number): void {
		if (!this.state.running || !(dt > 0)) return
		this.pace.advance(dt, (step) => {
			if (this.state.running) this.tick(step)
		})
	}

	/**
	 * A pause does not bank a dash: see `resumeFightAfterPause`.
	 *
	 * `recharge` is the manual's pause: the dash still resolves, but its counter
	 * window is opened again from the resume instead of being charged as a miss —
	 * the lesson stopped the fight to teach exactly that dash.
	 */
	resumeFromPause(recharge = false): void {
		resumeFightAfterPause(this.state, this.motion, this.counter, recharge)
	}

	private tick(step: number): void {
		const s = this.state
		s.elapsed += step

		s.finalCooldown = Math.max(0, s.finalCooldown - step)

		const canPull = this.canAct
		const pull = s.hold && canPull ? pullVector(s) : null
		s.steeringNow = pull !== null
		// An un-pulled fish is not content to circle the middle of the ring: the
		// longer the player leaves it alone, the further out it aims.
		s.neglect = pull ? Math.max(0, s.neglect - FIGHT.neglectRecover * step) : s.neglect + step
		if (pull) {
			const angle = Math.atan2(pull.y, pull.x)
			s.lastSteerAngle = angle
			if (s.lastAimAngle !== null && Math.abs(angleDelta(s.lastAimAngle, angle)) < 0.2) {
				s.sameAimTime += step
				if (s.sameAimTime >= FIGHT.sameAimTime) {
					s.feintPending = true
					s.sameAimTime = 0
				}
			} else {
				s.sameAimTime = 0
			}
			s.lastAimAngle = angle
		} else {
			s.sameAimTime = 0
			s.lastAimAngle = null
		}

		this.stamina.updateGrip(step, pull !== null)
		this.stamina.updateEndurance(step, pull)
		this.stamina.maybeDesperate()
		s.advantage = Math.max(0, s.advantage - step)
		s.counterFlash = Math.max(0, s.counterFlash - step)
		s.stun = Math.max(0, s.stun - step)
		s.turnFlashValue = Math.max(0, s.turnFlashValue - step)

		if (s.warnTime > 0) {
			s.warnTime = Math.max(0, s.warnTime - step)
			// Rest means releasing the pull button, as in the mod.
			s.warnRest = s.hold ? 0 : s.warnRest + step
			s.vx *= Math.max(0, 1 - 7 * step)
			s.vy *= Math.max(0, 1 - 7 * step)
			s.bubbleTimer -= step
			if (s.bubbleTimer <= 0) {
				s.bubbleTimer = 0.04
				this.bubbleField.spawn(false)
			}
			if (s.warnTime === 0) this.motion.resolveTelegraph()
		} else if (s.feintTimer > 0) {
			s.warnRest = s.hold ? 0 : s.warnRest + step
			s.feintTimer = Math.max(0, s.feintTimer - step)
			// The turn: kill the false velocity and strike along the true heading.
			if (s.feintTimer === 0) this.motion.resolveFeintTurn()
		} else {
			if (s.stun > 0) {
				// A countered dash is cancelled: the fish hangs in place until the stun
				// expires and cannot start a new move before it does.
				s.vx *= Math.max(0, 1 - 12 * step)
				s.vy *= Math.max(0, 1 - 12 * step)
			} else {
				if (step > 0) this.motion.advanceScript(step)
				this.motion.updateTarget()
				this.motion.steer(step)
			}
		}

		// Latched after the dash state moved: a press on the warning is the grab.
		if (s.freshPress) this.counter.notePress()
		this.counter.update(step, s.hold) // The button, not the line: see counter.ts
		// The press edge is spent: a counter that skips the rest needs a new one.
		s.freshPress = false

		if (pull) {
			// A heavier fish comes in slower: the angler's pull has to drag its mass
			// across the circle, so the same input moves it less far per second.
			const power = PULL_ACCEL * s.load.pull
			s.vx += pull.x * power * step
			s.vy += pull.y * power * step
		}

		// Water drag plus a hard speed cap keeps the pull responsive but fair.
		s.vx *= Math.max(0, 1 - 0.9 * step)
		s.vy *= Math.max(0, 1 - 0.9 * step)
		const speed = Math.hypot(s.vx, s.vy)
		if (speed > MAX_SPEED) {
			const k = MAX_SPEED / speed
			s.vx *= k
			s.vy *= k
		}

		s.fishX += s.vx * step
		s.fishY += s.vy * step

		this.bubbleField.update(step)
		if (updateZone(s, step)) {
			this.finish(false)
			return
		}
		if (!s.running) return

		// A fight that neither side can finish is not allowed to hang forever.
		if (s.elapsed >= FIGHT.timeLimit) {
			this.finish(false)
			return
		}

		if (this.stamina.updateReady()) this.finish(true)

		// Two and a half radii (85 px): no pull brings the fish back in time from
		// there, so the hook is simply gone. Scripts aim no further than 1.75R, so
		// only a throw — a burst plus a wrong-way pull — lands here.
		if (Math.hypot(s.fishX, s.fishY) > FIGHT_RADIUS * 2.5) {
			this.finish(false)
		}
	}

	fishAngle(): number {
		return this.motion.fishAngle()
	}

	private finish(won: boolean): void {
		const s = this.state
		if (!s.running) return
		s.running = false
		// The fight is over, so the player is no longer steering, even if the
		// button is still down: `isSteering` drives the reel loop, and a stale
		// `true` here restarted the loop in the same frame the catch was settled
		// (it then kept playing under the whole catch display).
		s.steeringNow = false
		s.hold = false
		s.finishResult = { won }
		s.onFinish?.(s.finishResult)
	}
}

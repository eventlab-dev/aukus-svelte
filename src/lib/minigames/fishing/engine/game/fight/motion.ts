import { FIGHT, TIMING } from '../../config'
import { clamp, easeInOutQuad, lerp, randRange } from '../../utils'
import { angleDelta } from './angles'
import { BubbleField } from './bubbles'
import { FIGHT_RADIUS, TAU } from './constants'
import { zoneFeintOffset, zoneTuning } from './zoneTuning'
import type { Move } from '../behaviors'
import type { FightState } from './state'

/**
 * How far short of a dash target the fish starts braking, in pixels. Roughly
 * one ring radius: long enough that the burst visibly decelerates into the
 * target instead of arriving and rebounding, short enough that the dash still
 * covers open water at full speed.
 */
const DASH_BRAKE = FIGHT_RADIUS * 0.78

/**
 * Movement half of the fight: the authored move script, warning/feint state,
 * target selection and the steering that pulls the fish toward that target.
 */
export class FightMotion {
	/** `elapsed` when the last dash ended, for the gap between bursts. */
	private lastDashEnd = -Infinity
	/**
	 * Called when a strong dash starts its telegraph, with the delay before the
	 * real zone of that dash appears. The model owns the counter, the motion owns
	 * the script, so the two meet on this hook.
	 */
	onZoneStart?: (delay: number) => void

	constructor(
		private readonly state: FightState,
		private readonly bubbles: BubbleField
	) {}

	/** The heading of the fish around the ring. */
	fishAngle(): number {
		const s = this.state
		if (Math.hypot(s.fishX, s.fishY) < 0.5) return s.lastAngle
		return Math.atan2(s.fishY, s.fishX)
	}

	advanceScript(dt: number): void {
		const s = this.state
		if (s.current === null) return
		s.moveTime += dt * s.tempo
		if (s.moveTime < s.current.dur) return
		if (s.current.kind === 'dash') this.lastDashEnd = s.elapsed
		this.nextMove()
	}

	nextMove(): void {
		const s = this.state
		let move = s.script[s.moveIndex % s.script.length]
		if (s.lastRunPending && !s.lastRunUsed) {
			s.lastRunUsed = true
			s.lastRunPending = false
			move = { kind: 'dash', dir: 'away', dur: 0.55, strong: true }
		}
		// A fresh hook is never a burst: inside the opening grace the fish only
		// circles, and a dash that would have started now is deferred by a pause
		// instead of being thrown at a player who is still reading the gauges. The
		// script index is left alone, so the authored move comes next, not later.
		if (s.elapsed < FIGHT.startGrace && (move.strong === true || move.kind === 'dash')) {
			this.beginMove({ kind: 'pause', dur: FIGHT.startGrace - s.elapsed })
			return
		}
		// The same deferral for the panel's `dashGap`: a fish does not throw two
		// bursts back to back, so a dash that comes too soon after the last one
		// waits out the difference in a pause and keeps its place in the script.
		if (move.kind === 'dash') {
			const quiet = s.elapsed - this.lastDashEnd
			if (quiet < zoneTuning.dashGap) {
				this.beginMove({ kind: 'pause', dur: zoneTuning.dashGap - quiet })
				return
			}
		}
		s.moveIndex += 1
		this.beginMove(move)
	}

	/** Start `move` and set up its warning, if it has one. */
	private beginMove(move: Move): void {
		const s = this.state
		s.current = move
		s.moveTime = 0
		s.warnRest = 0
		s.counterWindow = 0
		// A grab prepared for the previous dash does not carry over: the next move
		// has its own heading, and a stale press must not arm it.
		s.counterPrepared = false
		s.feintActive = false
		s.feintHasRevealed = false
		s.feintTimer = 0
		s.moveStartAngle = this.fishAngle()
		s.moveStartRadius = this.fishRadius()
		s.escapeAngle = this.resolveAngle(move)
		if (move.kind === 'dash' || move.kind === 'arc') {
			s.lastAngle = s.escapeAngle
		}
		if (move.strong) {
			// A fish that senses an empty grip warns a little later.
			const pressure = s.grip < FIGHT.lowGrip ? 0.88 : 1
			s.warnTime = TIMING.telegraph * pressure
			const feint = s.feintPending || Math.random() < s.feintChance
			s.feintActive = feint
			if (feint) {
				s.feintPending = false
				// The spread is measured between the *edges* of the two zones, so the
				// panel's gap plus both half-angles is the heading offset.
				s.feintAngle =
					s.escapeAngle +
					(Math.random() < 0.5 ? -1 : 1) *
						zoneFeintOffset(randRange(zoneTuning.spreadMin, zoneTuning.spreadMax))
				s.warnAngle = s.feintAngle
			} else {
				s.warnAngle = s.escapeAngle
			}
			s.bubbleTimer = 0
			s.onWarn?.()
			// The zone of a strong dash appears with its telegraph; a feint hides its
			// truth behind the lie for `delay` seconds first. The hook opens the grab
			// for exactly the time the zone is painted.
			this.onZoneStart?.(feint ? zoneTuning.delay : 0)
			return
		}
		s.warnTime = 0
		s.warnAngle = s.escapeAngle
		if (move.kind === 'dash') this.bolt(0.7)
	}

	/**
	 * The telegraph is over. An honest dash bolts along its true heading and
	 * returns true so the caller can open the counter window; a feint only
	 * lunges toward the false arrow and schedules the turn, so it returns false.
	 */
	resolveTelegraph(): boolean {
		const s = this.state
		s.warnTime = 0
		if (s.feintActive) {
			this.boltAt(s.warnAngle, FIGHT.feintPower)
			s.feintTimer = FIGHT.feintDelay
			this.bubbles.burst()
			return false
		}
		this.bolt()
		this.bubbles.burst()
		return true
	}

	/** The feint's false lunge is over: strike along the true heading. */
	resolveFeintTurn(): void {
		const s = this.state
		s.warnTime = 0
		s.feintTimer = 0
		s.vx = 0
		s.vy = 0
		this.boltAt(s.escapeAngle, 1)
		s.turnFlashValue = 0.18
		s.feintHasRevealed = true
		this.bubbles.burst()
	}

	resolveAngle(move: Move): number {
		const s = this.state
		const here = this.fishAngle()
		const jitter = (spread: number) => (Math.random() - 0.5) * spread
		const dir = move.dir ?? 'flip'
		let base: number

		// Escape directions are relative to the ring, never to the cursor: the
		// player's pull stays a counter-force instead of choosing the escape side.
		if (dir === 'away') base = here + jitter(0.55)
		else if (dir === 'toward') base = here + Math.PI + jitter(0.5)
		else if (dir === 'same') base = s.lastAngle + jitter(0.35)
		else base = s.lastAngle + Math.PI + jitter(0.75)

		return base
	}

	/** A sudden burst along `angle`; the default is the move's true heading. */
	boltAt(angle: number, scale = 1): void {
		const s = this.state
		const power = (110 + s.fish.speed * 70) * scale * s.runPower
		s.vx += Math.cos(angle) * power
		s.vy += Math.sin(angle) * power
	}

	bolt(scale = 1): void {
		this.boltAt(this.state.escapeAngle, scale)
	}

	updateTarget(): void {
		const s = this.state
		const move = s.current
		if (!move) return
		const t = move.dur <= 0 ? 1 : clamp(s.moveTime / move.dur)
		const kind = move.kind
		// A fish nobody is pulling does not keep circling the middle: the longer
		// the player rests, the further out its target sits. `neglect` resets to 0
		// the moment the line is held, so the drift is a consequence of passivity,
		// not a permanent offset.
		const drift = Math.min(1, s.neglect / FIGHT.neglectRamp)
		const push = drift * FIGHT.neglectPush

		// Dash targets sit clearly outside the ring: a fish that is not being
		// pulled must be able to leave, so passivity is a real losing strategy. The
		// strong dash goes almost two radii out, which is the whole cost of a
		// missed counter now that the miss itself is free: the player pays in the
		// time it takes to drag the fish back, not in a meter penalty.
		if (kind === 'dash') {
			const radius = move.dir === 'toward' ? 0.3 : move.strong ? 1.75 : 1.6
			s.targetX = Math.cos(s.escapeAngle) * FIGHT_RADIUS * radius
			s.targetY = Math.sin(s.escapeAngle) * FIGHT_RADIUS * radius
			return
		}

		if (kind === 'arc') {
			const eased = easeInOutQuad(t)
			const angle = s.moveStartAngle + angleDelta(s.moveStartAngle, s.escapeAngle) * eased
			const radius = lerp(s.moveStartRadius, 1 + push, eased) * FIGHT_RADIUS
			s.targetX = Math.cos(angle) * radius
			s.targetY = Math.sin(angle) * radius
			return
		}

		if (kind === 'wave') {
			const cycles = move.cycles ?? 1
			const amp = (move.amplitude ?? 0.3) * 2.2
			const angle = s.moveStartAngle + Math.sin(t * TAU * cycles) * amp
			const radius = lerp(s.moveStartRadius, 1.05 + push, t) * FIGHT_RADIUS
			s.targetX = Math.cos(angle) * radius
			s.targetY = Math.sin(angle) * radius
			return
		}

		if (kind === 'zigzag') {
			const count = Math.max(1, move.count ?? 3)
			const amp = (move.amplitude ?? 0.28) * 3
			const slot = Math.min(count - 1, Math.floor(t * count))
			const angle = s.moveStartAngle + (slot % 2 === 0 ? amp : -amp)
			const radius = FIGHT_RADIUS * (1.12 + push)
			s.targetX = Math.cos(angle) * radius
			s.targetY = Math.sin(angle) * radius
			return
		}

		// Pause: with the line held the fish drifts back toward the middle to catch
		// a breath; left alone, it heads for the edge instead.
		const angle = s.moveStartAngle
		const radius = lerp(0.3, 1.3, drift) * FIGHT_RADIUS
		s.targetX = Math.cos(angle) * radius
		s.targetY = Math.sin(angle) * radius
	}

	steer(dt: number): void {
		const s = this.state
		const kind = s.current?.kind ?? 'pause'
		let speed = 40
		let steer = 4
		if (kind === 'dash') {
			speed = 130 + s.fish.speed * 70
			steer = 7.5
		} else if (kind === 'arc') {
			speed = 42 + s.fish.speed * 30
			steer = 3.6
		} else if (kind === 'wave') {
			speed = 38 + s.fish.speed * 28
			steer = 4
		} else if (kind === 'zigzag') {
			speed = 64 + s.fish.speed * 40
			steer = 6.5
		} else if (kind === 'pause') {
			speed = 12
			steer = 2
		}

		const dx = s.targetX - s.fishX
		const dy = s.targetY - s.fishY
		const distance = Math.hypot(dx, dy)
		// A dash is a burst to an authored target, and it has to *arrive* there.
		// A constant-speed pursuit overshot: the fish entered the target carrying
		// most of its burst, so a dash aimed at 1.75R actually settled near 2.0R and
		// with the line out of grip it went past the 2.5R tear-off line — the fish
		// "just ran out of the circle" while the player held the button. Braking in
		// the last `DASH_BRAKE` pixels keeps the burst, drops the overshoot, and
		// leaves the tear-off for its documented cause: a burst plus a pull the
		// wrong way.
		const brake = kind === 'dash' ? clamp(distance / DASH_BRAKE, 0, 1) : 1
		const desiredX = distance > 1 ? (dx / distance) * speed * brake : 0
		const desiredY = distance > 1 ? (dy / distance) * speed * brake : 0
		const blend = Math.min(1, steer * dt)
		s.vx += (desiredX - s.vx) * blend
		s.vy += (desiredY - s.vy) * blend
	}

	private fishRadius(): number {
		const s = this.state
		return clamp(Math.hypot(s.fishX, s.fishY) / FIGHT_RADIUS, 0, 1.4)
	}
}

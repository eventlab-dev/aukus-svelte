import type { FishSpecies } from '../../fish'
import type { Temperament } from '../../types'
import type { Move } from '../behaviors'
import type { Bubble, MinigameResult, WeightLoad } from './types'

/**
 * Mutable state of one ring fight. The model and its three helpers
 * (`FightMotion`, `FightStamina`, `FightCounter`) share this object instead of
 * reaching into each other: the model owns the tick order, the helpers own
 * their own rules.
 */
export interface FightState {
	readonly fish: FishSpecies
	readonly centerX: number
	readonly centerY: number
	readonly load: WeightLoad
	readonly temperament: Temperament
	readonly tempo: number
	readonly runPower: number
	readonly tirePower: number
	readonly recoveryPower: number
	readonly feintChance: number
	readonly escapeHold: number
	readonly recoveryRate: number

	fishX: number
	fishY: number
	vx: number
	vy: number
	targetX: number
	targetY: number

	script: Move[]
	moveIndex: number
	current: Move | null
	moveTime: number
	moveStartAngle: number
	moveStartRadius: number
	escapeAngle: number
	lastAngle: number
	warnTime: number
	warnAngle: number
	warnRest: number
	/** A strong dash that first lunges toward a false warning. */
	feintActive: boolean
	feintTimer: number
	feintAngle: number
	feintHasRevealed: boolean
	turnFlashValue: number

	endurance: number
	grip: number
	gripLock: number
	advantage: number
	counterWindow: number
	/**
	 * Seconds until the real zone of this dash appears, i.e. until the counter
	 * window opens. A feint waits out its lie first; an honest dash is at zero.
	 */
	counterDelay: number
	/** Length of the window that opens once `counterDelay` runs out, in seconds. */
	counterSpan: number
	counterAngle: number
	counterArmed: boolean
	/**
	 * The button went down while a dash was already live — in its telegraph, its
	 * feint lunge or its counter window.
	 *
	 * The grab may be prepared: pressing on the dash side before the window opens
	 * has to count, otherwise the whole move is a reflex test against a window
	 * shorter than a reaction. The flag belongs to the dash it was made in: a new
	 * move clears it, so a press left over from an earlier dash cannot arm the
	 * next one and the counter never fires by itself.
	 */
	counterPrepared: boolean
	counterUsed: boolean
	counterPending: boolean
	counterFlash: number
	/**
	 * A stick flick into the sector, waiting for the counter to read it.
	 *
	 * On a phone the dash is answered by pushing the stick at it; the flag carries
	 * that one event from the control to the rules, which accept it on their next
	 * tick while the window is open and then clear it. A mouse never sets it.
	 */
	stickGrabAngle: number | null
	stun: number
	preBurstAngle: number | null
	lastSteerAngle: number | null
	ready: boolean
	lastReadyChime: number

	sameAimTime: number
	lastAimAngle: number | null
	feintPending: boolean
	lastRunPending: boolean
	lastRunUsed: boolean
	lastRunRolled: boolean

	hold: boolean
	/**
	 * True for the tick right after the pull button went down. A counter that
	 * skips the rest (`reversed`) needs the player to actually press again;
	 * otherwise simply aiming against the run would land counters on its own.
	 */
	freshPress: boolean
	finalCooldown: number

	pointerX: number | null
	pointerY: number | null
	/**
	 * Where the pull button went down.
	 *
	 * The counter is a gesture: the player grabs the direction arrow and drags
	 * toward the middle of the ring, so the press has to be remembered. It is
	 * null until the first press, and refreshed on every new one.
	 */
	pressX: number | null
	pressY: number | null
	directionX: number
	directionY: number
	steeringNow: boolean
	/**
	 * Seconds since the player last actively pulled. The fish uses it to drift
	 * out of the ring: resting is meant to be a beat, not a place to live.
	 */
	neglect: number
	/** Last meaningful cursor direction, kept while the cursor covers the fish. */
	stickyX: number
	stickyY: number

	bubbles: Bubble[]
	bubbleTimer: number

	running: boolean
	outside: boolean
	outsideTimer: number
	/** Seconds left before the inside recovery applies again after a miss. */
	escapeLock: number
	/**
	 * Seconds of escape clock still to pour in from missed dashes.
	 *
	 * A miss deposits its whole share here at once and the clock drinks it over
	 * `missFillTime`, so the meter climbs instead of jumping.
	 */
	escapeFill: number
	elapsed: number
	finishResult: MinigameResult | null

	onFinish?: (result: MinigameResult) => void
	onWarn?: () => void
	onCounter?: () => void
	onReady?: () => void
	onResist?: () => void
	onGripOut?: () => void
}

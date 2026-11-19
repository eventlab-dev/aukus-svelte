import { LUCK_BAND, TAP_REACH, TOUCH_TAP_REACH } from '../../config'
import { randRange } from '../../utils'
import { CastFlowCore } from './CastFlowCore'
import { PULL_KEYS, PRIMARY_KEYS, type PullKey } from './setup'

export abstract class CastFlowInput extends CastFlowCore {
	/** Pointer that owns this cast's press; -1 while no pointer gesture runs. */
	protected gestureId = -1

	setPointer(x: number, y: number): void {
		this.pointerX = x
		this.pointerY = y
	}

	/**
	 * The chip under the right thumb: hold to charge a cast, release to throw.
	 *
	 * Between rounds the cast is the only thing it does; inside one the same chip
	 * lands the fish, so the two never compete for a press.
	 */
	castHold(held: boolean): void {
		if (this.paused) return
		if (this.phaseValue !== 'idle' && this.phaseValue !== 'charging') return
		if (held) this.pressStart()
		else this.pressEnd()
	}

	/**
	 * The touch stick: down is the reel, up is the rest.
	 *
	 * It is the same pull the mouse button gives, because the fight is the same
	 * fight: hold to work the fish, let go to let the grip come back.
	 *
	 * The wait is the one phase it does not strike in. A stick is a control a
	 * thumb *rests* on, and the controls appear the moment the float lands — so a
	 * hand left on it would spook every cast. A tap on the water still spooks, as
	 * it always did: that gesture is the cast's own control, not a resting hand.
	 * At the bite a held stick is the strike (see `CastFlowState`), because a
	 * held control cannot produce the press a mouse makes.
	 */
	setStickHold(held: boolean): void {
		if (this.paused) return
		const phase = this.phaseValue
		if (phase === 'waiting') {
			this.pressed = held
			return
		}
		if (phase !== 'fighting' && phase !== 'bite') return
		if (held) this.pressStart()
		else this.pressEnd()
	}

	/** Stick deflection: the pull direction, normalized by the control. */
	setStickDirection(x: number, y: number): void {
		this.stickX = x
		this.stickY = y
	}

	/** The stick grabbed the counter sector: point at the dash, pull back. */
	stickGrab(angle: number): void {
		if (this.phaseValue !== 'fighting' || this.paused) return
		this.fight.counterFromStick(angle)
	}

	pointerDown(button: number, pointerType = 'mouse', pointerId = -1): void {
		// Right click is the final pull; the browser menu is suppressed. A second
		// finger on a phone arrives with no button at all, so the owner of the
		// gesture is decided by the screen, not here.
		if (button === 2) return
		this.gestureId = pointerId
		const target = this.phaseValue === 'fighting' && !this.paused ? this.fight.landingTarget : null
		// A tap on the tired fish lands it, but only on a touch screen. With a
		// mouse, the left button *is* the reel: pressing it with the cursor over
		// the fish used to land the catch on the release, so the same button both
		// pulled the line and loosed the strike. Desktop players keep RMB / F for
		// the final pull.
		const tap = pointerType === 'touch' || pointerType === 'pen'
		if (target && tap) {
			const dx = this.pointerX - target.x
			const dy = this.pointerY - target.y
			if (Math.hypot(dx, dy) <= this.tapReach().radius) {
				this.tapLanding = true
				this.tapIconX = target.x
				this.tapIconY = target.y
				return
			}
		}
		this.tapLanding = false
		this.pressStart()
	}

	pointerUp(pointerId = -1): void {
		if (!this.ownsGesture(pointerId)) return
		this.gestureId = -1
		if (this.tapLanding) {
			const moved = Math.hypot(this.pointerX - this.tapIconX, this.pointerY - this.tapIconY)
			this.tapLanding = false
			if (moved <= this.tapReach().release) {
				this.finalPull()
				return
			}
		}
		this.pressEnd()
	}

	pointerCancel(pointerId = -1): void {
		if (!this.ownsGesture(pointerId)) return
		this.gestureId = -1
		this.tapLanding = false
		this.pressEnd()
	}

	/**
	 * A second finger touching the screen mid-fight.
	 *
	 * It never steers and never ends the first finger's hold: the only thing it
	 * may do is tap the tired fish, which is the one gesture of the fight that is
	 * a tap instead of a press-and-drag.
	 */
	secondaryTap(x: number, y: number): boolean {
		if (this.phaseValue !== 'fighting' || this.paused) return false
		const target = this.fight.landingTarget
		if (!target) return false
		const dx = x - target.x
		const dy = y - target.y
		if (Math.hypot(dx, dy) > this.tapReach().radius) return false
		this.finalPull()
		return true
	}

	/** The reach of the landing tap for the input in the player's hands. */
	protected tapReach(): { radius: number; release: number } {
		return this.game.touch ? TOUCH_TAP_REACH : TAP_REACH
	}

	/** True for the pointer that started the current gesture, or no owner. */
	private ownsGesture(pointerId: number): boolean {
		return pointerId < 0 || this.gestureId < 0 || pointerId === this.gestureId
	}

	/** Gameplay keys; the screen handles pause and codex first. */
	handleKeyDown(event: KeyboardEvent): boolean {
		if (this.phaseValue === 'fighting' && event.code === 'KeyF') {
			if (!event.repeat) this.finalPull()
			return true
		}
		if (this.phaseValue === 'fighting' && event.code in PULL_KEYS) {
			this.pullKeys.add(event.code as PullKey)
			return true
		}
		if (PRIMARY_KEYS.has(event.code)) {
			if (!event.repeat) this.pressStart()
			return true
		}
		return false
	}

	handleKeyUp(event: KeyboardEvent): void {
		if (this.pullKeys.delete(event.code as PullKey)) return
		if (PRIMARY_KEYS.has(event.code)) this.pressEnd()
	}
	protected pressStart(): void {
		if (this.paused) return
		if (this.phaseValue === 'idle') {
			this.phaseValue = 'charging'
			this.scene.setPulling(true)
			this.chargeValue = 0
			this.chargeDir = 1
			this.chargeSoundTimer = 0
			this.chargeTime = 0
			this.lastZoneInside = -Infinity
			this.wasInsideZone = false
			this.luckZoneHit = false
			this.luckBandCenterValue = randRange(LUCK_BAND.min, LUCK_BAND.max)
			// A phone has no cursor over the water to aim with: the throw gets its own
			// spot in the band, and the power walks the float along that line.
			if (this.game.touch) this.pickTouchAim()
		} else if (this.phaseValue === 'waiting') {
			// The wait starts the moment the cast is released, but the float needs
			// `castFlight` seconds to hit the water. A press during that arc is not a
			// strike: before this guard it counted as an early hook and spooked a
			// fish that had not even landed yet.
			if (!this.scene.castLanded) return
			this.earlyHook()
		} else if (this.phaseValue === 'bite') {
			// The player just pressed on the bite prompt — hook immediately. The
			// fight starts with no strike held, so landing stays a deliberate press.
			this.pressed = true
			this.hookFish()
		} else if (this.phaseValue === 'fighting') {
			this.pressed = true
			this.scene.setPulling(true)
			this.fight.setHold(true)
		} else if (this.phaseValue === 'resolve') {
			// The catch display ends on the same press that would have cast: once the
			// fish has landed, a click (or Space) skips the hold instead of waiting
			// out the full three seconds.
			this.skipCatch()
		}
	}

	protected pressEnd(): void {
		this.pressed = false
		this.scene.setPulling(false)
		if (this.phaseValue === 'charging') this.doCast()
		this.fight.setHold(false)
	}

	/** Final pull: RMB/F on desktop, a tap on the tired fish on touch. */
	finalPull(): void {
		if (this.phaseValue !== 'fighting' || this.paused) return
		this.fight.finalPull()
	}
	protected readPullDirection(): { x: number; y: number } {
		let x = 0
		let y = 0
		for (const key of this.pullKeys) {
			const [dx, dy] = PULL_KEYS[key]
			x += dx
			y += dy
		}
		const length = Math.hypot(x, y)
		return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 }
	}
}

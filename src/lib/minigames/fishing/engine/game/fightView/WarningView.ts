import { Graphics } from 'pixi.js'
import { FIGHT_RADIUS } from '../fight'
import { zoneTuning } from '../fight/zoneTuning'
import { UI } from '../../ui/palette'
import { clamp } from '../../utils'
import { RingView } from './RingView'
import { counterLockPoint, drawCounterLock } from './counterLock'
import { INTRO_DURATION } from './setup'
import { ZoneClock } from './zoneClock'
import { drawZoneWedge } from './zoneWedge'

export abstract class WarningView extends RingView {
	/**
	 * The real zone's life: it fades in when the dash starts, and — on a feint —
	 * only after `zoneTuning.delay`, so the truth arrives once the lie has been
	 * read. Shared with the `F8` panel's preview through {@link ZoneClock}, so the
	 * panel shows the same motion the fight plays.
	 */
	protected readonly truthZone = new ZoneClock()
	/** The false side of a feint: its own life, so it fades out on its own. */
	protected readonly lieZone = new ZoneClock()
	/** Heading the real zone is drawn at; held while it fades out. */
	protected coneHeading = 0
	/** The feint's false heading, drawn violet; null while the dash is honest. */
	protected coneLie: number | null = null

	/**
	 * Advances the zones' clocks. The geometry is deliberately *not* eased: the
	 * zone is drawn from the very wedge the model tests a press against, so its
	 * opacity may trail the rule but the shape must not. Called once per frame
	 * with the fight's own `dt`, before {@link drawWarning}.
	 */
	protected updateJerkZone(dt: number): void {
		const model = this.model
		const open = model.counterOpen > 0
		const warn = model.warn > 0
		// A caught counter keeps the zone on screen while the padlock is up, and
		// drains it to the blocked grey instead of leaving it rose.
		const blocked = model.counterFlashValue > 0
		const lie = warn && model.isFeint

		// The truth is painted exactly as long as the model keeps its grab open —
		// the window and the paint are one span — and the lie for its own time from
		// the telegraph.
		this.truthZone.update(dt, open, blocked, zoneTuning.truthTime)
		this.lieZone.update(dt, lie, blocked, zoneTuning.lieTime)

		if (open || warn) {
			// The rose zone marks the heading the fish will really take. On a feint's
			// telegraph that is `counterHeading`, not the `warnHeading` the violet zone
			// shows: drawing both from `warnHeading` stacks the lie on itself and the
			// true zone disappears under it.
			this.coneHeading = open || model.isFeint ? model.counterHeading : model.warnHeading
		}
		// The lie keeps its heading until its own fade-out is over, so it does not
		// pop off the screen in the frame the telegraph ends.
		if (lie) this.coneLie = model.warnHeading
		else if (this.lieZone.alpha() <= 0) this.coneLie = null
	}

	protected drawWarning(): void {
		const g = this.warnG
		g.clear()
		if (this.intro < INTRO_DURATION) return
		// After a feint the false arrow is gone; a short amber arc marks where the
		// fish actually turned, so the reversal is readable instead of a teleport.
		if (this.model.turnFlash > 0) {
			this.strokeArc(
				g,
				FIGHT_RADIUS + 2,
				1,
				this.model.turnHeading - 0.35,
				this.model.turnHeading + 0.35,
				{
					width: 2,
					color: UI.amber,
					alpha: Math.min(1, this.model.turnFlash * 5)
				}
			)
		}

		// One zone per direction: an honest dash gets the rose one, a feint gets the
		// rose truth and the violet lie. The lie is painted from the telegraph for
		// `lieTime`; the truth from the moment the model opens its grab, for
		// `truthTime` — the same span the press is accepted over. A spent grip dims
		// the truth: the band is still the band, but the hand that would use it has
		// nothing left, and the grip gauge next to it is already wearing its padlock.
		const usable = this.model.isGripLocked ? 0.4 : 1
		this.drawGrabWedge(
			g,
			this.coneHeading,
			this.truthZone.alpha() * usable,
			this.truthZone.tone(UI.rose)
		)
		if (this.coneLie !== null) {
			this.drawGrabWedge(g, this.coneLie, this.lieZone.alpha(), this.lieZone.tone(UI.violet))
		}
	}

	/**
	 * One zone of the ring, drawn around the fight's centre. The shape and the
	 * recipe live in {@link drawZoneWedge}, shared with the `F8` panel's preview:
	 * what the panel shows is the drawing the fight does, not a lookalike.
	 */
	protected drawGrabWedge(g: Graphics, heading: number, alpha: number, color: number): void {
		drawZoneWedge(g, this.model.centerX, this.model.centerY, heading, alpha, color)
	}

	protected drawCounterFlash(): void {
		const g = this.counterG
		g.clear()

		if (this.model.counterFlashValue <= 0) {
			this.lockG.clear()
			return
		}
		// A landed counter is one mark: the padlock, hanging on the float the player
		// is already watching (or on the fish, if the panel says so). It says "this
		// jerk is cancelled" and sits where the jerk was. No shockwave rings — the
		// fight already draws its own ring, the float its waterline and the counter
		// cone flashes in the same instant, so every extra circle turned a clear
		// "blocked" into a burst of them.
		const lock = this.lockG
		lock.clear()
		const point = counterLockPoint({
			float: this.floatPoint,
			fish: this.model.fishPoint
		})
		const lit = clamp(this.model.counterFlashValue / Math.max(0.05, zoneTuning.lockTime))
		drawCounterLock(lock, point.x, point.y, lit)
	}

	/**
	 * Small arrow orbiting the float and pointing along the fish's velocity.
	 *
	 * It used to orbit the fish, which put the one "where is it going" cue on the
	 * thing that is moving instead of on the thing the player is watching — the
	 * float. The float leads the fish by a few pixels, so the arrow sits on the
	 * water mark the player already tracks.
	 */
	protected drawDirection(): void {
		const g = this.directionG
		g.clear()
		const velocity = this.model.fishVelocity
		const speed = Math.hypot(velocity.x, velocity.y)
		if (speed < 8) return

		const angle = Math.atan2(velocity.y, velocity.x)
		const point = this.floatPoint
		const x = point.x + Math.cos(angle) * 12
		const y = point.y + Math.sin(angle) * 12
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const at = (lx: number, ly: number): [number, number] => [
			x + lx * cos - ly * sin,
			y + lx * sin + ly * cos
		]
		const triangle = [...at(3, 0), ...at(-2, -3), ...at(-2, 3)]

		g.poly(triangle).fill({ color: UI.text, alpha: 0.9 })
		g.poly(triangle).stroke({ width: 1, color: UI.ink, alpha: 0.9 })
	}
}

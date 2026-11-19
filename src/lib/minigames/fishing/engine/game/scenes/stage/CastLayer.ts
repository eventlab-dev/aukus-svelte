import { C, TIMING } from '../../../config'
import { clamp, easeOutCubic, lerp } from '../../../utils'
import { mixColor } from '../../../world'
import { castAway, castBand, safeCastSpot } from '../../castSafety'
import { aimCast } from '../../castAim'
import { AnglerLayer } from './AnglerLayer'
import { drawFishStamina, drawStaminaThreshold } from './staminaArc'
import { BITE_SINK, NIBBLE_DIP, nibbleDip } from './setup'

export abstract class CastLayer extends AnglerLayer {
	/** Remaining fish endurance, 0..1; the gauge under the float. */
	protected fishStamina = 1

	/** Feeds the escape clock: how far the fish has torn the line out. */
	setEscapeMeter(value: number): void {
		this.escapeMeter = clamp(value)
	}

	/** Feeds the fish-stamina gauge; the float carries it during the fight. */
	setFishStamina(value: number): void {
		this.fishStamina = clamp(value)
		this.drawStaminaArc()
	}

	/** Repaints the endurance stub on the float, or hides it outside a fight. */
	protected drawStaminaArc(): void {
		const g = this.staminaArc
		const notch = this.staminaThreshold
		if (this.phase !== 'fight') {
			g.visible = false
			notch.visible = false
			return
		}
		g.visible = true
		notch.visible = true
		drawFishStamina(g, this.fishStamina)
		drawStaminaThreshold(notch)
	}
	/**
	 * Launches the float toward `aim` — the pointer at the moment of release on a
	 * mouse, the spot picked when the charge started on a phone — with the charge
	 * deciding how far along that line it lands. Without an aim the cast still
	 * goes out along the water's own axis, which is what the scripted casts and
	 * the dev hooks rely on.
	 */
	playCast(power: number, aim?: { x: number; y: number }): void {
		this.pulling = false
		// A fresh cast starts with a rested fish: no fatigue carries over.
		this.escapeMeter = 0
		this.fishStamina = 1
		this.drawStaminaArc()
		this.castPower = clamp(power)
		const cast = aimCast({
			from: { x: this.rodTip.x, y: this.rodTip.y },
			aim: aim ?? { x: this.rodTip.x, y: this.rodTip.y },
			layout: this.layout,
			power: this.castPower
		})

		const spot = this.settleCast(cast.x, cast.y, cast.away)
		this.bobberBaseX = spot.x
		this.bobberBaseY = spot.y
		this.bobber.position.set(this.rodTip.x - 1, this.rodTip.y - 2)
		this.bobber.visible = true
		this.bobberWash.visible = false
		this.bobber.alpha = 1
		this.biteMark.visible = false
		this.phase = 'flying'
		this.castT = 0
		this.setAngler(this.frames.cast, 11)
		this.spawnSplash(this.rodTip.x, this.rodTip.y, 6, 0.6)
	}

	/**
	 * Keeps the landed float far enough from the bank and the angler that the
	 * whole fight ring lands on water. The area bands already satisfy this at
	 * every power, so the search is a guarantee rather than the tuning knob; it
	 * only reports in development when a band edit broke the rule.
	 *
	 * `warn` is off for the aim preview, which runs this same search on every
	 * frame of a charge: the console message is about the authored band, and a
	 * preview would print it sixty times a second.
	 */
	protected settleCast(
		x: number,
		y: number,
		away = castAway(this.layout),
		warn = true
	): { x: number; y: number; moved: number; safe: boolean } {
		const isWater = (px: number, py: number): boolean => this.renderer.isWater(px, py)
		const spot = safeCastSpot({
			point: { x, y },
			isWater,
			angler: this.layout.angler,
			away,
			bounds: castBand(this.layout)
		})
		if (!warn) return spot
		if (import.meta.env.DEV && !spot.safe) {
			console.warn(
				`[fishing] ${this.area.id}: no cast spot clears the fight ring ` +
					`(landed at ${x.toFixed(0)},${y.toFixed(0)})`
			)
		} else if (import.meta.env.DEV && spot.moved > 0) {
			console.warn(
				`[fishing] ${this.area.id}: the cast had to be moved ${spot.moved}px ` +
					`to clear the ring or the sky rail; check the bobber band in areas.ts`
			)
		}
		return spot
	}

	/** True once the float has splashed down; the strike is gated on this. */
	get castLanded(): boolean {
		return this.phase !== 'flying'
	}

	/** Small fake dip shortly before the real bite — anticipation, not a prompt. */
	showNibble(): void {
		if (this.phase !== 'waiting') return
		this.nibbleTime = TIMING.nibbleDuration
		this.spawnSplash(this.bobberBaseX, this.bobberBaseY + 3, 2, 0.25)
	}

	showBite(): void {
		this.phase = 'bite'
		this.biteMark.visible = true
		// Placed before the per-frame pass can see it, or the first frame shows the
		// mark at the corner it was left in and it jumps to the float.
		this.placeBiteMark(0)
	}

	/** Puts the bite mark over the float, `bounce` pixels higher. */
	protected placeBiteMark(bounce: number): void {
		this.biteMark.position.set(this.bobber.x + 2, this.bobber.y - 8 - bounce)
	}

	celebrateLuck(): void {
		this.spawnSplash(this.bobberBaseX, this.bobberBaseY, 18, 1, [C.gold, C.yellow])
		this.rings.push({
			x: this.bobberBaseX,
			y: this.bobberBaseY,
			radius: 3,
			maxRadius: 28,
			life: 0.62,
			maxLife: 0.62
		})
	}

	setFight(): void {
		this.phase = 'fight'
		this.pulling = false
		this.biteMark.visible = false
		this.fightBobberX = this.bobberBaseX
		this.fightBobberY = this.bobberBaseY
		this.fightTargetX = this.bobberBaseX
		this.fightTargetY = this.bobberBaseY
		this.fightDirX = 0
		this.fightDirY = 1
		this.setAngler(this.frames.wait, 8)
		this.hookJerk = 0.22
		this.spawnHookBurst()
	}

	/** Holding LMB: wind-up before a cast or a pull during the fight. */
	setPulling(pulling: boolean): void {
		if (this.pulling === pulling) return
		this.pulling = pulling

		if (pulling) {
			if (this.phase === 'idle' || this.phase === 'fight') {
				this.setAngler(this.frames.pull, 9)
			}
			return
		}

		if (this.phase === 'idle') this.setAngler(this.frames.idle, 8)
		else if (this.phase === 'fight') this.setAngler(this.frames.wait, 8)
	}

	/** During the fight the float rides slightly ahead of the fish. */
	setFightFish(x: number, y: number, vx: number, vy: number, lead = false): void {
		if (this.phase !== 'fight') return
		const speed = Math.hypot(vx, vy)
		if (speed > 6) {
			this.fightDirX = vx / speed
			this.fightDirY = vy / speed
		}
		// Always lead the fish: a bit stronger while the player is actively
		// steering, so the float reads as being dragged in the travel direction.
		const offset = lead ? 8 : 6
		this.fightTargetX = x + this.fightDirX * offset
		this.fightTargetY = y + this.fightDirY * offset
	}

	/**
	 * Presents a landed fish above the angler and returns the y of its top edge,
	 * so the label can be drawn directly on top of it.
	 */
	protected abstract spawnHookBurst(): void
	protected abstract spawnSplash(
		x: number,
		y: number,
		count: number,
		strength: number,
		colors?: [number, number]
	): void

	protected updateCast(dt: number): void {
		const flight = TIMING.castFlight
		const tension = this.phase === 'fight' ? this.escapeMeter : 0
		if (this.nibbleTime > 0) {
			this.nibbleTime = Math.max(0, this.nibbleTime - dt)
		}
		if (this.phase === 'flying') {
			this.castT += dt
			const t = clamp(this.castT / flight)
			const eased = easeOutCubic(t)
			const fromX = this.rodTip.x - 1
			const fromY = this.rodTip.y - 2
			const x = lerp(fromX, this.bobberBaseX, eased)
			const y =
				lerp(fromY, this.bobberBaseY, eased) - Math.sin(Math.PI * t) * (26 + this.castPower * 24)
			this.bobber.position.set(x, y)
			this.bobberBody.y = 0
			this.bobberBody.rotation = t * Math.PI * 2
			if (t >= 1) {
				this.bobberBody.rotation = 0
				this.bobber.position.set(this.bobberBaseX, this.bobberBaseY)
				this.phase = 'waiting'
				this.spawnSplash(this.bobberBaseX, this.bobberBaseY, 8, 0.7 + this.castPower * 0.4)
				this.onCastLanded?.()
				// Frame 13 holds the rod level over the water while the float waits.
				this.setAngler(this.frames.wait, 8)
			}
		} else if (this.phase === 'waiting' || this.phase === 'bite') {
			const bob = Math.sin(this.time * 3.1) * 1.2
			this.bobber.position.set(this.bobberBaseX, this.bobberBaseY + bob)
			// A nibble tugs the float down a little; a real bite takes it all the way
			// under. Both are done by sliding the body behind the waterline mask, so
			// the float reads as being pulled down through the surface instead of
			// bouncing on it.
			this.sinkTarget =
				this.phase === 'bite' ? BITE_SINK : this.nibbleTime > 0 ? nibbleDip(this.nibbleTime) : 0
			this.bobberBody.rotation = this.phase === 'bite' ? Math.sin(this.time * 30) * 0.2 : 0
		} else if (this.phase === 'fight') {
			const follow = Math.min(1, dt * 14)
			this.fightBobberX = lerp(this.fightBobberX, this.fightTargetX, follow)
			this.fightBobberY = lerp(this.fightBobberY, this.fightTargetY, follow)
			this.hookJerk = Math.max(0, this.hookJerk - dt)
			const jerkT = this.hookJerk > 0 ? 1 - this.hookJerk / 0.22 : 1
			const jerk = this.hookJerk > 0 ? Math.sin(jerkT * Math.PI * 2) * 3.6 * (1 - jerkT) : 0
			this.bobber.position.set(
				this.fightBobberX,
				this.fightBobberY + Math.sin(this.time * 8) * 1.2 + jerk
			)
			// Struck fish: the float pops back to the surface and only dips again as
			// the fish tears the line away. The sink is the whole escape cue now, so
			// it goes deeper than the old four pixels.
			this.sinkTarget = tension * 6 - jerk * 0.8
			this.bobberBody.rotation = Math.sin(this.time * 6) * 0.16
			if (Math.random() < dt * 2) {
				this.spawnSplash(this.fightBobberX, this.fightBobberY, 1, 0.35)
			}
		} else {
			this.bobberBody.y = 0
			this.sinkTarget = 0
		}

		// One shared clock for the sink. Going down is a slow glide, not a snap:
		// the bite window is only about half a second, so the float has to be
		// *pulled* under for the player to read it as the fish taking the bait,
		// not as the sprite being teleported.
		const sinkRate = this.sinkTarget > this.bobberBody.y ? 5.5 : 9
		this.bobberBody.y = lerp(this.bobberBody.y, this.sinkTarget, Math.min(1, dt * sinkRate))
		// The waterline shine belongs to a float that is on the surface.
		this.bobberWash.alpha = clamp(1 - this.bobberBody.y / 5)

		// Line + bite marker. A high escape meter straightens and stiffens the
		// line; the float itself is being dragged under.
		this.line.clear()
		if (this.bobber.visible) {
			const rodX = this.rodTip.x
			const rodY = this.rodTip.y
			const bx = this.bobber.x
			// The float slides under the surface on a bite and again as the escape
			// meter grows (that is what `bobberBody.y` is). The line used to stay
			// pinned to the float's resting spot, so a drowned float kept a line
			// hanging in mid-air above it. It now follows the body down.
			const by = this.bobber.y - 5 + this.bobberBody.y
			const sag = this.phase === 'fight' ? Math.max(0.5, 2 - tension * 1.5) : 8
			const jitter = this.phase === 'fight' ? Math.sin(this.time * 30) * tension * 1.2 : 0
			this.line.moveTo(rodX, rodY)
			this.line.quadraticCurveTo((rodX + bx) / 2 + jitter, (rodY + by) / 2 + sag, bx, by)
			this.line.stroke({
				width: 1 + tension * 1.2,
				color: C.cream,
				alpha: 0.6 + tension * 0.35
			})
		}

		this.biteMark.visible = this.phase === 'bite'
		if (this.biteMark.visible) {
			this.placeBiteMark(Math.abs(Math.sin(this.time * 6)) * 5)
		}

		// --- the water answers the float ------------------------------------
		// Ellipses, not the splash rings: this is the waterline of a float sitting
		// in the lake, so it is drawn as a squashed ring on the surface. The splash
		// rings are for things that *enter* the water; the float never leaves it.
		this.bobberRipple.clear()
		this.bobberWash.visible =
			this.phase === 'waiting' || this.phase === 'bite' || this.phase === 'fight'
		if (this.bobberWash.visible) {
			/** Looking down at the water: rings are circles cut by the surface. */
			const surface = 0.72
			const pulse = (Math.sin(this.time * 2.4) + 1) / 2
			// The waterline of a float being dragged down: the deeper the body sits
			// under the surface, the wider the ring it pushes out and the warmer it
			// runs — ice at rest, red when the float is close to drowning. The shape
			// is the same water it always was; only the water's answer to the float
			// changes, so the escape cue lives on the float instead of in a gauge.
			const sink = this.phase === 'fight' ? clamp(this.bobberBody.y / 6) : 0
			const resting = 4.6 + pulse * 1.4 + sink * 3.2
			this.bobberRipple.ellipse(0, 0, resting, resting * surface).stroke({
				width: 1,
				color: mixColor(this.palette.ice, C.red, sink),
				alpha: 0.42 + pulse * 0.18 + sink * 0.22
			})
			// A tug on the bait also pushes the surface: the ellipse spreads with the
			// dip and fades as the float settles back.
			const tug = this.nibbleTime > 0 ? nibbleDip(this.nibbleTime) / NIBBLE_DIP : 0
			if (tug > 0) {
				const rx = 5 + tug * 6
				this.bobberRipple.ellipse(0, 0, rx, rx * surface).stroke({
					width: 1,
					color: this.palette.snow,
					alpha: 0.55 * (1 - tug * 0.3)
				})
			}
		}
	}
}

import { easeOutCubic, clamp } from '../../utils'
import { UI } from '../../ui/palette'
import { BarsView } from './BarsView'
import {
	FISH_SCALE,
	INTRO_DURATION,
	LAND_RING_CLOSE,
	LAND_RING_INNER,
	LAND_RING_OUTER,
	SILHOUETTE,
	SILHOUETTE_ALPHA,
	SILHOUETTE_COUNTER,
	SILHOUETTE_WARN
} from './setup'

export class Minigame extends BarsView {
	update(dt: number): void {
		if (!this.model.isRunning) return

		// The entrance is visual only: the fight is fully interactive from the
		// first frame, so a stuck/lagging intro can never freeze the catch.
		if (this.intro < INTRO_DURATION) {
			this.intro = Math.min(INTRO_DURATION, this.intro + dt)
		}
		const introT = easeOutCubic(this.intro / INTRO_DURATION)
		this.introScale = 0.65 + 0.35 * introT

		this.fishSprite.alpha = SILHOUETTE_ALPHA
		this.barG.alpha = 1
		this.counterG.alpha = 1
		this.ringG.alpha = 1
		this.barG.y = 0

		this.model.update(dt)
		if (!this.model.isRunning) return
		this.updateJerkZone(dt)
		this.updateLandRing(dt)
		this.updateEscape(dt)
		this.draw()
		this.syncFishVisual()
	}

	protected syncFishVisual(): void {
		const point = this.model.fishPoint
		const velocity = this.model.fishVelocity
		this.fishSprite.position.set(point.x, point.y)
		this.fishSprite.rotation = clamp(velocity.x / 420, -0.45, 0.45)
		const face = velocity.x < -6 ? -1 : velocity.x > 6 ? 1 : this.fishSprite.scale.x < 0 ? -1 : 1
		const grow = 0.82 + 0.18 * this.introScale
		this.fishSprite.scale.set(face * FISH_SCALE * grow, FISH_SCALE * grow)
		// A countered jerk lifts the shadow towards the lock's ice: the padlock and
		// the fish are one marker, and the fish must not wear a second ring.
		this.fishSprite.tint =
			this.model.counterFlashValue > 0
				? SILHOUETTE_COUNTER
				: this.model.warn > 0
					? SILHOUETTE_WARN
					: SILHOUETTE
	}

	// -------------------------------------------------------------------- draw

	protected draw(): void {
		this.drawRing()
		this.drawCounterFlash()
		this.drawStamina()
		this.drawEscape()
		this.drawDirection()
		this.drawCue()
		this.drawWarning()
		this.drawLandRing()
	}

	/**
	 * Opens the landing cue on the tired fish: the fish's own outline lights up
	 * and breathes for as long as the window stays open. The window can close
	 * again at any moment (the fish shakes the hook loose or catches its breath),
	 * so the outline fades out on its own clock instead of blinking away.
	 */
	protected updateLandRing(dt: number): void {
		const landable = this.model.canLand
		if (landable && !this.wasLandable) this.landCue = 0
		this.wasLandable = landable
		if (landable) {
			this.landCue = Math.min(1, this.landCue + dt / LAND_RING_CLOSE)
		}

		const target = landable ? 1 : 0
		// Fast in — the window is short — and slower out, so the eye can follow it.
		const rate = target > this.landFade ? 14 : 7
		this.landFade += (target - this.landFade) * Math.min(1, dt * rate)
		if (this.landFade < 0.005) this.landFade = 0
	}

	/**
	 * Draws the catch window on the float: an amber ring that closes from
	 * {@link LAND_RING_OUTER} to {@link LAND_RING_INNER} as the window opens and
	 * then breathes at that size.
	 *
	 * It used to close on the fish, and then it was replaced by an outline of the
	 * fish; both put the cue on the thing that moves. The float is what the player
	 * is watching — it carries the endurance gauge and the direction pointer — so
	 * the ring frames the float and those two cues inside it.
	 */
	protected drawLandRing(): void {
		const g = this.landRing
		g.clear()
		if (this.landFade <= 0.005) return
		const closed = easeOutCubic(Math.min(1, this.landCue))
		const radius = LAND_RING_OUTER + (LAND_RING_INNER - LAND_RING_OUTER) * closed
		const breathe = Math.sin(this.model.time * 7) * 0.7
		g.circle(this.floatPoint.x, this.floatPoint.y, radius + breathe).stroke({
			width: 1.5,
			color: UI.amber,
			alpha: 0.9 * this.landFade
		})
	}
}

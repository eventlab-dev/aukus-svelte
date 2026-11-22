import { Graphics } from 'pixi.js'
import { FIGHT_RADIUS } from '../fight'
import { WINTER } from '../../world'
import { UI } from '../../ui/palette'
import { clamp } from '../../utils'
import { RING_SEGMENTS, ringRadiusAt } from '../fightRing'
import { MinigameCore } from './MinigameCore'
import { TAU } from './setup'

export abstract class RingView extends MinigameCore {
	protected waveRadius(angle: number, radius: number, line: number, time: number): number {
		return ringRadiusAt(angle, radius, line, time)
	}

	protected wavePoints(radius: number, line: number, from = 0, to = TAU): number[] {
		const points: number[] = []
		const steps = Math.max(8, Math.round((RING_SEGMENTS * (to - from)) / TAU))
		for (let i = 0; i <= steps; i += 1) {
			const angle = from + ((to - from) * i) / steps
			const r = this.waveRadius(angle, radius * this.introScale, line, this.model.time)
			points.push(
				this.model.centerX + Math.cos(angle) * r,
				this.model.centerY + Math.sin(angle) * r
			)
		}
		return points
	}

	/**
	 * Stroke an arc fragment as an open path. `poly()` closes the path, so a
	 * partial arc was drawn together with its chord and read as a lens.
	 */
	protected strokeArc(
		g: Graphics,
		radius: number,
		line: number,
		from: number,
		to: number,
		style: { width: number; color: number; alpha: number }
	): void {
		const points = this.wavePoints(radius, line, from, to)
		g.moveTo(points[0], points[1])
		for (let i = 2; i < points.length; i += 2) {
			g.lineTo(points[i], points[i + 1])
		}
		g.stroke(style)
	}

	protected drawRing(): void {
		const g = this.ringG
		const time = this.model.time
		const pulse = (Math.sin(time * 3.2) + 1) / 2
		const radius = Math.hypot(this.model.fishOffset.x, this.model.fishOffset.y) / FIGHT_RADIUS
		const proximity = clamp((radius - 0.55) / 0.45, 0, 1)
		const introBoost = 1 - this.introScale

		g.clear()

		// The ordinary boundary is barely there: it emerges only as the fish
		// approaches the rim, and never changes colour as a whole.
		const alpha = 0.06 + proximity * 0.16 + pulse * 0.03 + introBoost * 0.45
		g.poly(this.wavePoints(FIGHT_RADIUS, 1)).stroke({
			width: 1.2,
			color: WINTER.snow,
			alpha
		})
		g.poly(this.wavePoints(FIGHT_RADIUS - 3, 0)).stroke({
			width: 1,
			color: WINTER.snow,
			alpha: alpha * 0.35
		})

		// No extra contour on impact. A dash used to flash a second wavy ring two
		// pixels outside the boundary, which read as the zone growing an outline
		// exactly when the player has to judge the rim — the one moment a second
		// circle is least welcome. The bolt is already announced by the orange
		// pointer, the frightened fish and the bubbles.

		// Leaving the zone lights the rim on the side the fish is escaping to. It
		// has no mark of its own otherwise: the float sinking under the surface is a
		// slow cue, and a fish already outside the ring is losing the fight, so the
		// edge itself has to say it. Drawn as a short arc at the fish's heading, so
		// it never competes with the direction pointer on the float.
		const offset = Math.hypot(this.model.fishOffset.x, this.model.fishOffset.y)
		const proximityToEdge = clamp((offset / FIGHT_RADIUS - 0.85) / 0.3, 0, 1)
		if (proximityToEdge > 0.02) {
			const heading = Math.atan2(this.model.fishOffset.y, this.model.fishOffset.x)
			this.strokeArc(g, FIGHT_RADIUS + 2, 1, heading - 0.5, heading + 0.5, {
				width: 2,
				color: UI.rose,
				alpha: proximityToEdge * (0.35 + pulse * 0.45)
			})
		}
	}
}

import { Graphics } from 'pixi.js'
import { CoveScenery } from './CoveScenery'
import { MOORED_BOAT } from './geometry'

export class CoveMotion extends CoveScenery {
	drawMotion(g: Graphics, time: number): void {
		g.clear()

		this.water.draw(g, time)

		// Sunlight breaking on the wavelets.
		for (const glint of this.glints) {
			const pulse = (Math.sin(time * glint.speed + glint.phase) + 1) / 2
			if (pulse < 0.55) continue
			g.rect(glint.x, glint.y, glint.size, 1).fill({
				color: 0xf7fbfd,
				alpha: (pulse - 0.55) * 1.5
			})
		}

		for (const mark of this.waterMarks) {
			const pulse = (Math.sin(time * mark.speed + mark.phase) + 1) / 2
			const radius = mark.radius * (0.65 + pulse * 0.45)
			g.ellipse(mark.x, mark.y, radius, radius * 0.38).stroke({
				width: 1,
				color: this.palette.ice,
				alpha: mark.alpha * (0.4 + pulse * 0.6)
			})
			if (pulse > 0.72) {
				g.rect(mark.x - 1, mark.y - radius * 0.38 - 2, 2, 1).fill({
					color: this.palette.snow,
					alpha: mark.alpha * 0.8
				})
			}
		}

		for (const whirl of this.whirls) {
			const angle = time * whirl.spin + whirl.phase
			for (let i = 0; i < 3; i += 1) {
				const radius = whirl.radius * (0.45 + i * 0.17)
				const start = angle + (i * Math.PI * 2) / 3
				// `arc()` connects the current path to the arc start, which produced a
				// stray diagonal line across the lake. Move to the start point first.
				g.moveTo(whirl.x + Math.cos(start) * radius, whirl.y + Math.sin(start) * radius)
				g.arc(whirl.x, whirl.y, radius, start, start + 0.72).stroke({
					width: 1,
					color: this.palette.snow,
					alpha: whirl.alpha
				})
			}
		}
		// Rings lapping at the moored hull.
		for (let i = 0; i < 2; i += 1) {
			const t = (time * 0.3 + i * 0.5) % 1
			g.ellipse(MOORED_BOAT.x, MOORED_BOAT.y + 6, 20 + t * 16, 4.5 + t * 3).stroke({
				width: 1,
				color: this.palette.snow,
				alpha: 0.15 * (1 - t)
			})
		}
	}

	// ------------------------------------------------------------------ water
}

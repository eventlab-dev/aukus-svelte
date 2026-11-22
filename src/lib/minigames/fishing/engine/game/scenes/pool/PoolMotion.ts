import { Graphics } from 'pixi.js'
import { PoolScenery } from './PoolScenery'
import { CENTER } from './geometry'

export class PoolMotion extends PoolScenery {
	drawMotion(g: Graphics, time: number): void {
		g.clear()

		// The water first: mist and wisps drift over it, never under.
		this.water.draw(g, time)

		// Drifting mist over the water.
		for (let i = 0; i < 5; i += 1) {
			const x = CENTER.x + Math.sin(time * 0.12 + i) * 120 - 60 + i * 28
			const y = 92 + i * 11 + Math.sin(time * 0.3 + i * 2) * 3
			g.ellipse(x, y, 60, 7).fill({
				color: this.palette.snowLight,
				alpha: 0.025
			})
		}

		// Pale wisps in the reeds.
		for (const wisp of this.wisps) {
			const pulse = (Math.sin(time * wisp.speed + wisp.phase) + 1) / 2
			g.circle(wisp.x, wisp.y, wisp.radius * (0.7 + pulse * 0.7)).fill({
				color: 0x9fe8d8,
				alpha: 0.12 + pulse * 0.18
			})
			g.circle(wisp.x, wisp.y, 1).fill({
				color: 0xd8fff2,
				alpha: 0.5 + pulse * 0.4
			})
		}

		// Bubbles rising from the bottom.
		for (const bubble of this.bubbles) {
			const y = CENTER.y + 90 - ((time * bubble.speed + bubble.y) % 150)
			g.circle(bubble.x + Math.sin(time + bubble.phase) * 2, y, 1).stroke({
				width: 1,
				color: this.palette.snow,
				alpha: 0.16
			})
		}
	}

	// ------------------------------------------------------------------ water
}

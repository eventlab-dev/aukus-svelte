import { Graphics } from 'pixi.js'
import { VIEW } from '../../../config'
import { clamp } from '../../../utils'
import { RiverScenery } from './RiverScenery'
import { BOULDERS } from './geometry'

export class RiverMotion extends RiverScenery {
	drawMotion(g: Graphics, time: number): void {
		g.clear()

		// Surface motion sits under the ice slabs, so a floe still reads as solid
		// and the crests break against its edge instead of running across it.
		this.water.draw(g, time)

		// Floating ice slabs carried downstream along the current.
		for (const drift of this.drifts) {
			const x = ((drift.x + time * drift.speed + 60) % (VIEW.width + 80)) - 40
			if (x < -20 || x > VIEW.width + 20) continue
			const top = this.farAt(x)
			const bottom = this.nearAt(x)
			if (bottom - top < drift.rx * 2.4) continue
			const y = top + (bottom - top) * drift.offset
			const edge = Math.min(x + 20, VIEW.width + 20 - x) / 26
			const alpha = clamp(edge)
			if (alpha <= 0.05) continue
			const points: number[] = []
			for (let i = 0; i < drift.shape.length; i += 2) {
				points.push(x + drift.shape[i] * drift.rx, y + drift.shape[i + 1] * drift.ry)
			}
			g.poly(points).fill({ color: this.palette.ice, alpha: 0.72 * alpha })
			// Top face catches the light; the upstream edge stays bright.
			const cap: number[] = []
			for (let i = 0; i < points.length; i += 2) {
				cap.push(x + (points[i] - x) * 0.66, y + (points[i + 1] - y) * 0.66 - drift.ry * 0.12)
			}
			g.poly(cap).fill({ color: this.palette.snowLight, alpha: 0.8 * alpha })
			g.poly(points).stroke({
				width: 1,
				color: this.palette.snow,
				alpha: 0.5 * alpha
			})
			g.moveTo(x - drift.rx * 0.4, y - drift.ry * 0.1)
				.lineTo(x + drift.rx * 0.15, y + drift.ry * 0.2)
				.stroke({ width: 1, color: this.palette.iceDeep, alpha: 0.6 * alpha })
			// Slush trail behind the slab.
			this.rect(
				g,
				x - drift.rx - 4,
				y + 0.5,
				drift.rx * 0.8,
				1,
				this.palette.snowLight,
				0.2 * alpha
			)
		}

		// Rises: fish and air come up mid-channel.
		for (const bubble of this.bubbles) {
			const pulse = (Math.sin(time * bubble.speed + bubble.phase) + 1) / 2
			const radius = 2.5 + pulse * 5
			g.ellipse(bubble.x, bubble.y, radius, radius * 0.34).stroke({
				width: 1,
				color: this.palette.ice,
				alpha: 0.3 - pulse * 0.24
			})
			if (pulse > 0.88) {
				this.rect(g, bubble.x - 1, bubble.y - 1, 1, 1, this.palette.snow, 0.45)
			}
		}

		// Foam breathing along both waterlines.
		for (let x = 6; x < VIEW.width; x += 13) {
			const pulse = (Math.sin(time * 1.6 + x * 0.16) + 1) / 2
			const y = this.nearLine[x] - 1
			g.moveTo(x, y)
				.lineTo(x + 5 + pulse * 4, y - 1.5)
				.stroke({
					width: 1,
					color: this.palette.snowLight,
					alpha: 0.12 + pulse * 0.14
				})
		}
		for (let x = 10; x < VIEW.width; x += 19) {
			const pulse = (Math.sin(time * 1.3 + x * 0.11 + 1.7) + 1) / 2
			const y = this.farLine[x] + 2
			g.moveTo(x, y)
				.lineTo(x + 4 + pulse * 4, y + 1)
				.stroke({
					width: 1,
					color: this.palette.ice,
					alpha: 0.1 + pulse * 0.12
				})
		}

		// Water piling against the boulders. It used to be a pair of arcs orbiting
		// the upstream stone, which swept across its face once per revolution and
		// read as a drawn ring rather than as current. Each boulder now carries two
		// still arcs at its own waterline that only breathe, so the water works
		// against the stone instead of circling it.
		for (const rock of BOULDERS) {
			const height = rock.size * 1.15
			const water = rock.y + height * 0.34
			const pulse = (Math.sin(time * 1.3 + rock.x) + 1) / 2
			for (let i = 0; i < 2; i += 1) {
				g.ellipse(rock.x, water + 1 + i, rock.size * (1.15 + i * 0.5), 1.4 + i * 0.5).stroke({
					width: 1,
					color: this.palette.snow,
					alpha: (0.13 - i * 0.05) * (0.55 + pulse * 0.9)
				})
			}
		}
	}

	// ------------------------------------------------------------------ water

	/**
	 * The current works the sunken trunk: it rolls on the swell and creeps a
	 * little downstream, the way a log caught in the channel never quite sits
	 * still. The drift stays under a pixel so the trunk keeps its place.
	 */
	animate(time: number): void {
		const trunk = this.trunk
		if (!trunk) return
		trunk.y = this.trunkBaseY + Math.sin(time * 0.62) * 0.6
		trunk.x = this.trunkBaseX + Math.sin(time * 0.21) * 0.7
		trunk.rotation = Math.sin(time * 0.44 + 1.2) * 0.014
	}
}

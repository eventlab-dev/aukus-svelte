import { C } from '../../../config'
import { clamp, lerp, randRange } from '../../../utils'
import { CastLayer } from './CastLayer'

export class FxLayer extends CastLayer {
	protected spawnHookBurst(): void {
		const x = this.bobberBaseX
		const y = this.bobberBaseY
		this.spawnSplash(x, y, 24, 1.45)

		// Hook strike: a short, energetic spray in addition to the normal splash.
		for (let i = 0; i < 16; i += 1) {
			const maxLife = randRange(0.35, 0.85)
			this.particles.push({
				x: x + randRange(-3, 3),
				y: y + randRange(-2, 2),
				vx: randRange(-72, 72),
				vy: randRange(-150, -40),
				life: maxLife,
				maxLife,
				size: i % 4 === 0 ? 3 : 2,
				color: Math.random() > 0.5 ? C.cyan : this.palette.ice
			})
		}

		this.rings.push({
			x,
			y,
			radius: 2,
			maxRadius: 30,
			life: 0.55,
			maxLife: 0.55
		})
	}

	protected spawnSplash(
		x: number,
		y: number,
		count: number,
		strength: number,
		colors: [number, number] = [this.palette.snow, this.palette.ice]
	): void {
		for (let i = 0; i < count; i += 1) {
			const maxLife = randRange(0.3, 0.7)
			this.particles.push({
				x: x + randRange(-2, 2),
				y: y + randRange(-2, 2),
				vx: randRange(-46, 46) * strength,
				vy: randRange(-95, -28) * strength,
				life: maxLife,
				maxLife,
				size: Math.random() > 0.7 ? 2 : 1,
				color: Math.random() > 0.4 ? colors[0] : colors[1]
			})
		}
		this.rings.push({
			x,
			y,
			radius: 2,
			maxRadius: 12 + strength * 4,
			life: 0.55,
			maxLife: 0.55
		})
		this.rings.push({
			x,
			y,
			radius: 1,
			maxRadius: 8 + strength * 3,
			life: 0.42,
			maxLife: 0.42
		})
	}

	protected updateParticles(dt: number): void {
		this.particlesG.clear()
		this.particles = this.particles.filter((particle) => {
			particle.life -= dt
			if (particle.life <= 0) return false
			particle.vy += 220 * dt
			particle.x += particle.vx * dt
			particle.y += particle.vy * dt
			const alpha = clamp(particle.life / particle.maxLife)
			this.particlesG
				.rect(particle.x, particle.y, particle.size, particle.size)
				.fill({ color: particle.color, alpha })
			return true
		})

		this.ringsG.clear()
		this.rings = this.rings.filter((ring) => {
			ring.life -= dt
			if (ring.life <= 0) return false
			const t = 1 - ring.life / ring.maxLife
			const radius = lerp(ring.radius, ring.maxRadius, t)
			this.ringsG
				.circle(ring.x, ring.y, radius)
				.stroke({ width: 1, color: this.palette.snow, alpha: (1 - t) * 0.7 })
			return true
		})
	}
}

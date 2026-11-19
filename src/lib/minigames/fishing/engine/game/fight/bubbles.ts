import type { FightState } from './state'

/** The warning bubbles a hooked fish blows before and during a dash. */
export class BubbleField {
	constructor(private readonly state: FightState) {}

	spawn(burst: boolean): void {
		const s = this.state
		const baseX = s.centerX + s.fishX
		const baseY = s.centerY + s.fishY
		const angle = s.warnAngle + (Math.random() - 0.5) * 0.55
		const speed = burst ? 50 + Math.random() * 50 : 20 + Math.random() * 30
		const life = burst ? 0.3 + Math.random() * 0.24 : 0.4 + Math.random() * 0.32
		s.bubbles.push({
			x: baseX + (Math.random() - 0.5) * 8,
			y: baseY + (Math.random() - 0.5) * 8,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life,
			maxLife: life,
			size: 1.2 + Math.random() * 1.6
		})
	}

	burst(): void {
		for (let i = 0; i < 8; i += 1) this.spawn(true)
	}

	update(step: number): void {
		const bubbles = this.state.bubbles
		for (const bubble of bubbles) {
			bubble.life -= step
			bubble.x += bubble.vx * step
			bubble.y += bubble.vy * step
			bubble.vx *= Math.max(0, 1 - 1.8 * step)
			bubble.vy *= Math.max(0, 1 - 1.8 * step)
		}
		for (let i = bubbles.length - 1; i >= 0; i -= 1) {
			if (bubbles[i].life <= 0) bubbles.splice(i, 1)
		}
	}
}

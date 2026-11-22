import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import { PEARL } from '../../config'
import { pearlScale, type PearlCatch } from '../../fish/pearls'
import { PearlView } from './PearlView'

interface Spark {
	x: number
	y: number
	vx: number
	vy: number
	life: number
	maxLife: number
	size: number
	color: number
}

const GOLD = 0xffd166
const CREAM = 0xfff8e0
const ICE = 0xcfe8ff

/** Overshoot of the pearl entrance: it arrives with a small bounce. */
function easeOutBack(t: number): number {
	const c1 = 1.70158
	const c3 = c1 + 1
	return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * The shell opening.
 *
 * A pearl is the payoff of the whole cast, so it does not replace the shell in
 * one frame: the shell trembles and gathers light, the light peaks, the shell
 * splits into two halves that fly apart, and only then does the pearl grow out
 * of the flash with a small overshoot. The sequence is presented in world
 * coordinates at the landing spot, on top of the existing legendary sunburst.
 *
 * The helper owns only the reveal itself. The catch layer keeps the flight, the
 * rays, the name tag and the round timing; it polls {@link ready} to know when
 * the pearl may be skipped.
 */
export class PearlReveal extends Container {
	private readonly pearl: PearlCatch
	/** Fired at the flash, so the catch layer can flare the sunburst. */
	onSplit?: () => void
	/** Fired once, when the pearl becomes visible. */
	onReveal?: () => void

	private readonly shell: Sprite
	private readonly topHalf: Sprite
	private readonly bottomHalf: Sprite
	private readonly pearlView: PearlView
	private readonly glow = new Graphics()
	private readonly ring = new Graphics()
	private readonly flash = new Graphics()
	private readonly sparks = new Graphics()

	private readonly shellScale: number
	private readonly targetScale: number
	private readonly halfHeight: number
	private readonly sparkList: Spark[] = []

	private stage: 'idle' | 'charge' | 'split' | 'pearl' = 'idle'
	private stageTime = 0
	private time = 0
	private sparkTimer = 0
	private revealed = false

	constructor(shellTexture: Texture, pearlTexture: Texture, pearl: PearlCatch, shellScale: number) {
		super()
		this.pearl = pearl
		this.shellScale = shellScale
		this.targetScale = pearlScale(pearl.sizeMm)
		this.eventMode = 'none'

		this.glow.blendMode = 'add'
		this.ring.blendMode = 'add'
		this.flash.blendMode = 'add'
		this.sparks.blendMode = 'add'
		this.addChild(this.glow)

		this.shell = new Sprite(shellTexture)
		this.shell.anchor.set(0.5)
		this.shell.scale.set(shellScale)
		this.addChild(this.shell)

		this.halfHeight = Math.floor(shellTexture.height / 2)
		const topFrame = new Texture({
			source: shellTexture.source,
			frame: new Rectangle(0, 0, shellTexture.width, this.halfHeight)
		})
		const bottomFrame = new Texture({
			source: shellTexture.source,
			frame: new Rectangle(
				0,
				this.halfHeight,
				shellTexture.width,
				shellTexture.height - this.halfHeight
			)
		})
		// The cut line is the hinge: the top half hangs from it, the bottom one
		// stands on it, so both start exactly where the closed shell was.
		this.topHalf = new Sprite(topFrame)
		this.topHalf.anchor.set(0.5, 1)
		this.topHalf.scale.set(shellScale)
		this.topHalf.visible = false
		this.addChild(this.topHalf)

		this.bottomHalf = new Sprite(bottomFrame)
		this.bottomHalf.anchor.set(0.5, 0)
		this.bottomHalf.scale.set(shellScale)
		this.bottomHalf.visible = false
		this.addChild(this.bottomHalf)

		this.pearlView = new PearlView(pearlTexture)
		this.pearlView.setPearl(pearl, pearl.grade)
		this.pearlView.visible = false
		this.pearlView.scale.set(0.1)
		this.addChild(this.pearlView)

		this.addChild(this.flash, this.ring, this.sparks)
	}

	/** Start the charge. Called once the shell has landed in the angler's hands. */
	begin(): void {
		if (this.stage !== 'idle') return
		this.stage = 'charge'
		this.stageTime = 0
		this.time = 0
		this.shell.visible = true
	}

	/** True once the pearl is whole and the player may skip the display. */
	get ready(): boolean {
		return this.stage === 'pearl'
	}

	setAlpha(alpha: number): void {
		this.alpha = alpha
	}

	advance(dt: number): void {
		if (this.stage === 'idle') return
		this.time += dt
		this.stageTime += dt

		if (this.stage === 'charge') {
			this.updateCharge(dt)
			if (this.stageTime >= PEARL.chargeTime) this.open()
		} else if (this.stage === 'split') {
			this.updateSplit()
		} else {
			this.updatePearl(dt)
		}
		this.updateSparks(dt)
		this.drawGlow()
		this.drawRing()
		this.drawFlash()
		this.pearlView.advance(dt)
	}

	// ------------------------------------------------------------- charge
	private updateCharge(dt: number): void {
		const progress = Math.min(1, this.stageTime / PEARL.chargeTime)
		// A tightening tremble, then a bigger pulse right before the flash.
		const tremble = 0.25 + progress * 1.1
		this.shell.x = Math.sin(this.time * 61) * tremble
		this.shell.y = Math.sin(this.time * 47 + 1.3) * tremble
		this.shell.rotation = Math.sin(this.time * 39) * 0.018 * progress
		const pulse = 1 + progress * 0.2 + Math.sin(this.time * 18) * 0.018 * progress
		this.shell.scale.set(this.shellScale * pulse)

		this.sparkTimer -= dt
		if (this.sparkTimer <= 0) {
			this.sparkTimer = 0.055
			this.addSpark(
				this.shell.x + (Math.random() - 0.5) * 10,
				this.shell.y + (Math.random() - 0.5) * 8,
				(Math.random() - 0.5) * 18,
				-18 - Math.random() * 26,
				0.45 + Math.random() * 0.35,
				Math.random() > 0.5 ? GOLD : CREAM,
				Math.random() > 0.7 ? 2 : 1
			)
		}
		if (progress > 0.55) {
			// Light gathering: sparks stream toward the shell instead of rising.
			if (Math.random() > 0.5) {
				const angle = Math.random() * Math.PI * 2
				const radius = 18 + Math.random() * 10
				this.addSpark(
					Math.cos(angle) * radius,
					Math.sin(angle) * radius,
					-Math.cos(angle) * 30,
					-Math.sin(angle) * 30,
					0.35,
					CREAM,
					1
				)
			}
		}
	}

	private open(): void {
		this.stage = 'split'
		this.stageTime = 0
		this.revealed = false
		this.shell.visible = false
		this.topHalf.visible = true
		this.bottomHalf.visible = true
		this.topHalf.scale.set(this.shellScale * 1.2)
		this.bottomHalf.scale.set(this.shellScale * 1.2)
		this.topHalf.position.set(0, 0)
		this.bottomHalf.position.set(0, 0)
		this.topHalf.rotation = 0
		this.bottomHalf.rotation = 0
		this.topHalf.alpha = 1
		this.bottomHalf.alpha = 1
		this.pearlView.visible = true
		this.pearlView.scale.set(0.1)
		this.pearlView.setPearl(this.pearl, this.pearl.grade)
		this.burst()
		this.onSplit?.()
	}

	private updateSplit(): void {
		const progress = Math.min(1, this.stageTime / PEARL.splitTime)
		const ease = 1 - Math.pow(1 - progress, 3)
		this.topHalf.x = -13 * ease
		this.topHalf.y = -22 * ease
		this.topHalf.rotation = -0.9 * ease
		this.bottomHalf.x = 11 * ease
		this.bottomHalf.y = 18 * ease
		this.bottomHalf.rotation = 0.68 * ease
		const fade = progress < 0.55 ? 1 : 1 - (progress - 0.55) / 0.45
		this.topHalf.alpha = fade
		this.bottomHalf.alpha = fade

		const grow = Math.min(1, this.stageTime / PEARL.pearlInTime)
		this.pearlView.scale.set(this.targetScale * easeOutBack(grow))
		if (!this.revealed && this.stageTime > 0.1) {
			this.revealed = true
			this.onReveal?.()
		}
		if (this.stageTime >= PEARL.splitTime) {
			this.stage = 'pearl'
			this.stageTime = 0
			this.topHalf.visible = false
			this.bottomHalf.visible = false
		}
	}

	private updatePearl(dt: number): void {
		this.pearlView.y = Math.sin(this.time * 2.4) * 1.5
		this.pearlView.rotation = Math.sin(this.time * 1.7) * 0.035
		this.pearlView.scale.set(this.targetScale)
		// A second, softer sparkle wave once the pearl is whole.
		this.sparkTimer -= dt
		if (this.sparkTimer <= 0) {
			this.sparkTimer = 0.16
			const angle = Math.random() * Math.PI * 2
			const radius = 12 + Math.random() * 8
			this.addSpark(
				Math.cos(angle) * radius,
				Math.sin(angle) * radius,
				Math.cos(angle) * 8,
				-Math.sin(angle) * 8 - 6,
				0.7,
				Math.random() > 0.4 ? GOLD : CREAM,
				1
			)
		}
	}

	// -------------------------------------------------------------- light
	private drawGlow(): void {
		const glow = this.glow
		glow.clear()
		if (this.stage === 'charge') {
			const progress = Math.min(1, this.stageTime / PEARL.chargeTime)
			const radius = 9 + progress * 24
			const alpha = 0.16 + progress * 0.5
			// A narrow column of light above the shell: the glow is what the pearl
			// is gathering, and the column makes it read from across the frame.
			glow.rect(-5, -70, 10, 70).fill({ color: GOLD, alpha: alpha * 0.22 })
			glow.rect(-2, -70, 4, 70).fill({ color: CREAM, alpha: alpha * 0.3 })
			for (let index = 0; index < 5; index += 1) {
				const step = index / 4
				glow.circle(0, 0, radius * (1 - step * 0.45)).fill({
					color: index > 2 ? CREAM : GOLD,
					alpha: alpha * (0.2 + step * 0.16)
				})
			}
			return
		}
		const breath = 0.88 + Math.sin(this.time * 2.6) * 0.12
		glow.rect(-3, -56, 6, 56).fill({ color: GOLD, alpha: 0.05 * breath })
		for (let index = 0; index < 6; index += 1) {
			const step = index / 5
			glow.circle(0, 0, 34 * (1 - step * 0.7)).fill({
				color: index > 3 ? CREAM : GOLD,
				alpha: (0.05 + step * 0.035) * breath
			})
		}
	}

	private drawRing(): void {
		const ring = this.ring
		ring.clear()
		if (this.stage !== 'split' && this.stage !== 'pearl') return
		const t = Math.min(1, this.stageTime / 0.55)
		const radius = 5 + t * 42
		ring.circle(0, 0, radius).stroke({ width: 1, color: CREAM, alpha: (1 - t) * 0.9 })
		if (this.stage === 'pearl') {
			const pulse = (this.time * 0.55) % 1
			ring.circle(0, 0, 14 + pulse * 24).stroke({
				width: 1,
				color: GOLD,
				alpha: (1 - pulse) * 0.35
			})
		}
	}

	private drawFlash(): void {
		const flash = this.flash
		flash.clear()
		if (this.stage !== 'split') return
		const t = Math.min(1, this.stageTime / 0.24)
		if (t >= 1) return
		flash.circle(0, 0, 12 + t * 46).fill({ color: CREAM, alpha: (1 - t) * 0.55 })
		flash.circle(0, 0, 6 + t * 26).fill({ color: 0xffffff, alpha: (1 - t) * 0.5 })
	}

	// ------------------------------------------------------------- sparks
	private addSpark(
		x: number,
		y: number,
		vx: number,
		vy: number,
		life: number,
		color: number,
		size: number
	): void {
		this.sparkList.push({ x, y, vx, vy, life, maxLife: life, size, color })
	}

	private burst(): void {
		for (let index = 0; index < 34; index += 1) {
			const angle = Math.random() * Math.PI * 2
			const speed = 35 + Math.random() * 95
			this.addSpark(
				0,
				0,
				Math.cos(angle) * speed,
				Math.sin(angle) * speed - 24,
				0.5 + Math.random() * 0.55,
				Math.random() > 0.35 ? GOLD : ICE,
				Math.random() > 0.75 ? 2 : 1
			)
		}
	}

	private updateSparks(dt: number): void {
		const graphics = this.sparks
		graphics.clear()
		for (let index = this.sparkList.length - 1; index >= 0; index -= 1) {
			const spark = this.sparkList[index]
			spark.life -= dt
			if (spark.life <= 0) {
				this.sparkList.splice(index, 1)
				continue
			}
			spark.vy += 34 * dt
			spark.x += spark.vx * dt
			spark.y += spark.vy * dt
			const alpha = Math.min(1, spark.life / (spark.maxLife * 0.6))
			graphics.rect(spark.x, spark.y, spark.size, spark.size).fill({
				color: spark.color,
				alpha
			})
		}
	}
}

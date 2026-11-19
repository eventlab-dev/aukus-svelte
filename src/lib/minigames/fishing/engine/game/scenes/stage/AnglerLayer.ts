import { Graphics, Sprite, Texture } from 'pixi.js'
import { VIEW } from '../../../config'
import { fishInArea } from '../../../fish'
import { clamp, randRange } from '../../../utils'
import { mixColor } from '../../../world'
import { paintContactShadow } from '../props'
import { FishingSceneCore } from './FishingSceneCore'

export abstract class AnglerLayer extends FishingSceneCore {
	protected addAnglerShadow(): void {
		const shadow = new Graphics()
		// The reference shadow the rest of the bank copies: same colour, same two
		// stacked ellipses, centred on the feet.
		paintContactShadow(shadow, this.layout.angler.x - 1, this.layout.angler.y - 6, 9)
		shadow.zIndex = this.layout.angler.y - 0.2
		this.props.addChild(shadow)
	}

	protected addLightLayers(): void {
		const light = this.layout.light
		if (!light) return
		this.lightGlow.zIndex = light.y - 0.3
		this.lightGlow.blendMode = 'add'
		this.props.addChild(this.lightGlow)

		this.lightFlame.zIndex = light.y + 0.1
		this.lightFlame.blendMode = 'add'
		this.props.addChild(this.lightFlame)
	}

	protected addAmbientFish(): void {
		const roster = fishInArea(this.area.id)
		if (roster.length === 0) return
		for (let i = 0; i < 3; i += 1) {
			const species = roster[(i * 4) % roster.length]
			const texture = this.assets.fish[species.id]
			if (!texture) continue
			const sprite = new Sprite(texture)
			sprite.anchor.set(0.5)
			sprite.alpha = 0.08
			sprite.tint = 0x0d4a66
			sprite.scale.set(randRange(0.62, 0.95))
			const direction = Math.random() > 0.5 ? 1 : -1
			sprite.scale.x = Math.abs(sprite.scale.x) * direction

			let placed = false
			for (let attempt = 0; attempt < 24 && !placed; attempt += 1) {
				const x = randRange(30, VIEW.width - 30)
				const y = randRange(40, VIEW.height - 40)
				if (!this.renderer.isWater(x, y)) continue
				sprite.position.set(x, y)
				placed = true
			}
			if (!placed) continue

			this.fishShadows.push({
				sprite,
				speed: randRange(6, 14) * direction,
				baseY: sprite.y,
				phase: randRange(0, Math.PI * 2)
			})
			this.addChildAt(sprite, 1)
		}
	}

	/** Warm light and flame; the fixture itself is drawn by the area renderer. */
	protected drawLight(): void {
		const glow = this.lightGlow
		const flame = this.lightFlame
		glow.clear()
		flame.clear()

		const light = this.layout.light
		if (!light) return
		// A campfire keeps burning in daylight; a lamp only matters after dusk.
		const level = light.kind === 'fire' ? Math.max(this.lanternLevel, 0.62) : this.lanternLevel
		if (level <= 0.02) return

		const flicker = 0.9 + Math.sin(this.time * 9.3) * 0.06 + Math.sin(this.time * 23.1) * 0.04
		const alpha = level * flicker
		const x = light.x
		// The rings are centred on the flame, not on the foot of the fixture: the
		// glass is what glows, and a halo sitting on the post read as light coming
		// out of the ground.
		const y = light.glowY
		const bright = mixColor(light.color, 0xffffff, 0.55)

		const rings = light.kind === 'fire' ? 6 : 8
		for (let i = 0; i < rings; i += 1) {
			const t = i / (rings - 1)
			const radius = light.radius * (1 - t * 0.82)
			glow.circle(x, y, radius).fill({
				color: mixColor(light.color, bright, t),
				alpha: (0.008 + t * 0.03) * alpha
			})
		}
		glow.ellipse(x + 3, light.y + 2, 10, 3).fill({
			color: light.color,
			alpha: 0.09 * alpha
		})

		if (light.kind === 'fire') {
			const ember = Math.sin(this.time * 13) * 1.2
			flame.rect(x - 5, y + 1, 10, 5).fill({
				color: light.color,
				alpha: 0.75 * alpha
			})
			flame.rect(x - 4, y - 2, 8, 5).fill({
				color: bright,
				alpha: 0.9 * alpha
			})
			flame.rect(x - 2 + ember, y - 7, 4, 6).fill({
				color: 0xfff2b0,
				alpha: 0.9 * alpha
			})
			flame.rect(x + 1, y - 11, 2, 5).fill({
				color: 0xffd166,
				alpha: 0.65 * alpha
			})
			flame.rect(x, y - 10, 1, 3).fill({
				color: 0xffffff,
				alpha: 0.55 * alpha
			})
		} else {
			flame.rect(x - 2, y + 1, 4, 3).fill({
				color: 0xffd166,
				alpha: 0.85 * alpha
			})
			flame.rect(x - 1, y, 2, 2).fill({
				color: 0xffef9a,
				alpha: alpha
			})
			flame.rect(x - 1, y + 2, 1, 1).fill({
				color: 0xffffff,
				alpha: 0.9 * alpha
			})
		}
	}

	/** 0 = off, 1 = night-bright; smooth so dusk and dawn look gradual. */
	setLantern(level: number): void {
		const t = clamp((level - 0.08) / 0.52)
		this.lanternLevel = t * t * (3 - 2 * t)
	}

	/**
	 * How much the sky is overcast, 0..1. The water surface uses it to throw
	 * drifting cloud shadows; it is eased in `update`, so a new front does not
	 * pop a dark patch onto the lake.
	 */
	setCloudiness(level: number): void {
		this.cloudTarget = clamp(level, 0, 1)
	}

	/** Dev hook: apply the current front's cloud cover without the blend. */
	snapCloudiness(level: number): void {
		this.cloudTarget = clamp(level, 0, 1)
		this.cloudiness = this.cloudTarget
	}

	// ------------------------------------------------------------- public API
	protected setAngler(frames: readonly number[], fps: number): void {
		this.anglerFrames = frames
		this.anglerFps = fps
		this.anglerTimer = 0
		this.angler.texture =
			this.assets.angler[frames[0]] ?? this.assets.angler[this.frames.idle[0]] ?? Texture.WHITE
	}
	protected updateAngler(dt: number): void {
		if (this.anglerFrames.length <= 1) {
			this.angler.texture =
				this.assets.angler[this.anglerFrames[0]] ??
				this.assets.angler[this.frames.idle[0]] ??
				this.angler.texture
			return
		}
		this.anglerTimer += dt * this.anglerFps
		const index = Math.min(this.anglerFrames.length - 1, Math.floor(this.anglerTimer))
		const frame = this.anglerFrames[index]
		const texture = this.assets.angler[frame]
		if (texture) this.angler.texture = texture
	}

	protected updateAmbient(dt: number): void {
		for (const item of this.fishShadows) {
			const sprite = item.sprite
			// Half the body plus a little, so a fish turns before its nose is over
			// the snow instead of after its tail has left the water.
			const reach = sprite.width * 0.4
			let facing = item.speed >= 0 ? 1 : -1
			const nextX = sprite.x + item.speed * dt
			const span = VIEW.width + reach * 2

			// A fish that leaves the frame comes back on the other side, but only
			// when that edge is open water: the bay runs to the frame, the lake does
			// not.
			if (nextX < -reach || nextX > VIEW.width + reach) {
				const wrapped = nextX < 0 ? nextX + span : nextX - span
				if (
					this.renderer.isWater(wrapped, sprite.y) &&
					this.renderer.isWater(wrapped + facing * reach, sprite.y)
				) {
					sprite.x = wrapped
					sprite.y = this.ambientY(item)
					continue
				}
			}

			// The shoal lives in the water. A fish that reached the bank used to
			// slide straight up the snow and pop out on the far side of the frame;
			// now it turns, and it only turns when there is water behind it, so a
			// fish trapped in a corner of the channel cannot jitter on the shore.
			const headX = nextX + facing * reach
			if (!this.renderer.isWater(nextX, sprite.y) || !this.renderer.isWater(headX, sprite.y)) {
				const turned = -item.speed
				const backX = sprite.x + Math.sign(turned) * reach
				if (this.renderer.isWater(sprite.x, sprite.y) && this.renderer.isWater(backX, sprite.y)) {
					item.speed = turned
					facing = Math.sign(turned)
					sprite.scale.x = Math.abs(sprite.scale.x) * facing
				}
				continue
			}

			sprite.x = nextX
			// The bob follows the body, so a fish near the surface stays under it.
			const nextY = this.ambientY(item)
			if (this.renderer.isWater(sprite.x, nextY)) sprite.y = nextY
		}
	}

	/** Vertical bob of an ambient fish, in scene pixels. */
	protected ambientY(item: { baseY: number; phase: number }): number {
		return item.baseY + Math.sin(this.time * 0.7 + item.phase) * 5
	}
}

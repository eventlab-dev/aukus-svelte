import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { TIMING, VIEW } from '../../../config'
import type { PearlCatch } from '../../../fish/pearls'
import type { FishTier } from '../../../types'
import { clamp, easeOutCubic, lerp, randRange } from '../../../utils'
import { ShinyShader } from '../../shinyShader'
import { PearlReveal } from '../../pearl/PearlReveal'
import { burstReach, burstSpin, paintBurst } from './catchBurst'
import { FxLayer } from './FxLayer'
import { CATCH_CLEARANCE } from './setup'

/** Step the catch's sunburst turns in, in radians: whole-pixel beats, not drift. */
const RAY_STEP = 0.04
/** Seconds per radian of that spin. */
const RAY_SPIN = 0.12
/**
 * How long the burst takes to open once the fish has settled, in seconds.
 *
 * The burst used to fade in over the whole arc, so the fish flew out of the
 * water inside a light that was already there. It is the fish's light: it waits
 * for the landing and then grows out of the catch.
 */
const RAY_OPEN_TIME = 0.28
/** Size it opens from, as a fraction of the resting burst. */
const RAY_OPEN_SCALE = 0.5
/**
 * Size steps the opening moves in, as a fraction of the burst: eighths keep it
 * on the same whole-pixel beats as the spin instead of shimmering through every
 * fractional edge on the way out.
 */
const RAY_SCALE_STEP = 0.125
/** How far past full size it swings before it settles back. */
const RAY_OPEN_SWELL = 0.16
/** Extra spin at the moment of opening, in multiples of the idle turn. */
const RAY_OPEN_SPIN = 5

export class CatchLayer extends FxLayer {
	/**
	 * The light behind a landed fish.
	 *
	 * A catch arrived as a sprite that flew out of the water and hovered over the
	 * angler, with nothing marking it as the payoff of the round. The rays are
	 * that mark: a sunburst of thin wedges behind the fish. They live in their own
	 * node so they stay *behind* the fish whatever else the layer draws, and they
	 * wait for the landing: lighting the arc as well put a halo around a fish that
	 * was still in the air, which read as weather rather than as the catch.
	 */
	private readonly rayNode = new Container()
	private readonly rayG = new Graphics()
	/** Tier the burst was baked for; a different catch re-bakes it. */
	private rayTier: FishTier | null = null
	private raySpin = 0
	private rayFade = 0
	private rayDim = 1
	/** 0..1 of the opening animation, from the moment the fish has landed. */
	private rayOpen = 0

	/** Pearl carried by the current shell catch, or null for an ordinary fish. */
	private pendingPearl: PearlCatch | null = null
	/**
	 * Rainbow coat of the catch. One instance per layer, re-used across shiny
	 * catches: the coat lives on the sprite, not on the fish, so the filter only
	 * has to be created once and its clock restarted per catch.
	 */
	private shiny: ShinyShader | null = null
	/** The catch sprite wearing the coat; detached before that sprite is destroyed. */
	private shinySprite: Sprite | null = null
	/** The opening sequence once the shell has landed. */
	private pearlReveal: PearlReveal | null = null
	/** True after the catch has settled in the angler's hands. */
	private catchLanded = false
	/** One-shot screen flash at the moment the shell opens, 0..1. */
	private screenFlash = 0
	private flashG: Graphics | null = null
	/**
	 * Fired when the pearl becomes visible. The round uses it for the landing
	 * chime and the bloom, so the payoff is heard as well as seen.
	 */
	onPearlReveal?: (pearl: PearlCatch) => void

	/**
	 * @param pearl When set, the texture is the shell and the catch is presented
	 * as a pearl: charge, split and pearl entrance before the tag.
	 * @param shiny The landed fish wears the rainbow coat. Ignored for a shell,
	 * whose payoff is the pearl rather than the carrier.
	 */
	catchFish(
		texture: Texture,
		scale = 1.15,
		tier: FishTier = 'common',
		pearl: PearlCatch | null = null,
		shiny = false
	): number {
		this.phase = 'result'
		this.pulling = false
		this.biteMark.visible = false
		this.clearHeldFish()
		this.pendingPearl = pearl
		const fromX = this.bobber.x
		const fromY = this.bobber.y
		this.spawnSplash(fromX, fromY, 18, 1.1)

		const half = (texture.height * scale) / 2
		/*
		 * Everything below is measured from the reach of the catch — the light
		 * included, and the light of *this* tier, because a mythic burst is half
		 * again as wide as a common one — rather than from the sprite:
		 *
		 * - the angler gets its gap to the bottom of the light, because with the
		 *   sprite alone as the reference the lower wedges were painted straight
		 *   over the hat and read as a halo stuck to the fisherman;
		 * - the name tag hangs from the top of the light, because a tag pinned to
		 *   the sprite ended up inside the rays.
		 */
		const reach = Math.max(half, burstReach(tier))
		const holdY = this.layout.angler.y - CATCH_CLEARANCE - reach
		this.catchSpot = { x: this.layout.angler.x, y: holdY, top: holdY - reach }

		// Behind the fish: added before the sprite, so every later child paints over
		// it. It stays dark and invisible until the fish has settled, but it has to
		// be in the list from the start to keep that order.
		this.buildRays(tier)
		this.rayNode.position.set(fromX, fromY)
		this.rayNode.scale.set(RAY_OPEN_SCALE)
		this.rayFade = 0
		this.rayDim = 1
		this.rayOpen = 0
		this.rayNode.alpha = 0
		this.rayNode.visible = false
		this.addChild(this.rayNode)

		const sprite = new Sprite(texture)
		sprite.anchor.set(0.5)
		sprite.scale.set(scale)
		sprite.position.set(fromX, fromY)
		this.addChild(sprite)
		if (shiny && !pearl) this.applyShinyCoat(sprite)
		this.jumps.push({
			sprite,
			t: 0,
			duration: TIMING.catchJump,
			fromX,
			fromY,
			spin: randRange(-0.5, 0.5),
			hold: true,
			scale
		})

		this.setAngler(this.frames.land, 6)
		this.bobber.visible = false
		return this.catchSpot.top
	}

	/**
	 * Puts the rainbow coat on the catch sprite.
	 *
	 * The filter is created on the first shiny only, and the sprite it is attached
	 * to is remembered: `clearHeldFish` has to take it off before the sprite is
	 * destroyed, because a filter outliving its display object keeps its framebuffer
	 * alive in the renderer for the rest of the session.
	 */
	private applyShinyCoat(sprite: Sprite): void {
		if (!this.shiny) this.shiny = new ShinyShader()
		this.shiny.reset()
		this.shinySprite = sprite
		sprite.filters = [this.shiny.filter]
	}

	escapeFish(): void {
		this.phase = 'result'
		this.pulling = false
		this.biteMark.visible = false
		this.spawnSplash(this.bobber.x, this.bobber.y, 10, 0.9)
		this.bobber.visible = false
		this.setAngler(this.frames.idle, 8)
	}

	/**
	 * True once the catch may be skipped. The flight is never skippable; for a
	 * shell the whole reveal is the payoff, so it counts as part of the flight
	 * and only unlocks when the pearl is whole.
	 */
	get catchSkipReady(): boolean {
		if (!this.catchLanded) return false
		return this.pearlReveal === null || this.pearlReveal.ready
	}

	/**
	 * Hands the landed shell over to the opening sequence. The shell sprite that
	 * just landed is hidden in the same frame, and the reveal draws its own copy
	 * at the same point, so the swap is invisible.
	 */
	private startPearlReveal(): void {
		const pearl = this.pendingPearl
		if (!pearl) return
		const shell = this.assets.fish.shell
		const face = this.assets.pearls[pearl.id]
		if (!shell || !face) return
		const reveal = new PearlReveal(shell, face, pearl, 1.15)
		reveal.position.set(this.catchSpot.x, this.catchSpot.y)
		reveal.onSplit = () => {
			this.flareRays()
			this.startScreenFlash()
		}
		reveal.onReveal = () => this.onPearlReveal?.(pearl)
		this.addChild(reveal)
		this.pearlReveal = reveal
		if (this.heldFish) this.heldFish.visible = false
		reveal.begin()
	}

	/** Re-opens the sunburst on the split, so the light peaks with the pearl. */
	private flareRays(): void {
		this.lightCatch()
	}

	/**
	 * A very short warm flash over the playfield at the split. It is the one
	 * moment the whole frame answers the shell, and it hides the swap from the
	 * closed shell to the two halves.
	 */
	private startScreenFlash(): void {
		if (!this.flashG) {
			const flash = new Graphics()
			flash.rect(0, 0, VIEW.width, VIEW.height).fill({ color: 0xfff6d8, alpha: 1 })
			flash.blendMode = 'add'
			flash.eventMode = 'none'
			this.flashG = flash
			this.addChild(flash)
		}
		// Re-add on every split so the flash sits over the current toy, not under
		// a reveal that was created after the previous one.
		this.addChild(this.flashG)
		this.screenFlash = 0.42
		this.flashG.alpha = this.screenFlash
	}

	private updateScreenFlash(dt: number): void {
		if (!this.flashG || this.screenFlash <= 0) return
		this.screenFlash = Math.max(0, this.screenFlash - dt * 2.6)
		this.flashG.alpha = this.screenFlash
	}

	resetCast(): void {
		this.phase = 'idle'
		this.pulling = false
		// The gauges belong to one fight, not to the session: a new cast always
		// starts from a rested fish and an empty escape clock, even if the previous
		// round ended with the line at the edge of tearing.
		this.escapeMeter = 0
		this.fishStamina = 1
		this.drawStaminaArc()
		this.biteMark.visible = false
		this.bobber.visible = false
		this.line.clear()
		this.setAngler(this.frames.idle, 8)
		this.castT = 0
		this.nibbleTime = 0
		this.clearHeldFish()
		for (const jump of this.jumps) jump.sprite.destroy()
		this.jumps = []
	}

	/** Fade the held catch while the idle cast prompt returns. */
	setHeldFishAlpha(alpha: number): void {
		const value = clamp(alpha, 0, 1)
		if (this.heldFish) {
			this.heldFish.alpha = value
		}
		this.pearlReveal?.setAlpha(value)
		this.rayDim = value
		this.applyRayAlpha()
	}

	/**
	 * Re-bakes the burst when the rarity changes.
	 *
	 * The shape itself is drawn by {@link paintBurst}, which owns what a common,
	 * an uncommon, a rare and a mythic catch look like; this layer only decides
	 * when the light is on screen and how it moves.
	 */
	private buildRays(tier: FishTier): void {
		if (this.rayTier === tier) return
		this.rayTier = tier
		if (!this.rayNode.parent) this.rayNode.addChild(this.rayG)
		this.rayNode.blendMode = 'add'
		paintBurst(this.rayG, tier)
	}

	/**
	 * Follows the fish, turns a notch at a time, eases open on arrival.
	 *
	 * The opening is the whole entrance: the burst starts smaller than the fish,
	 * swings a little past its resting size on the way out, spins faster for that
	 * half second and settles into the slow idle turn. A single hard cut at full
	 * size read as a texture switching on rather than as light arriving.
	 */
	private updateRays(dt: number, x: number, y: number): void {
		const tier = this.rayTier
		if (tier === null || !this.rayNode.visible) return
		this.rayNode.position.set(x, y)
		this.rayOpen = Math.min(1, this.rayOpen + dt / RAY_OPEN_TIME)
		const open = easeOutCubic(this.rayOpen)
		const swell = Math.sin(Math.PI * this.rayOpen) * RAY_OPEN_SWELL
		const size = RAY_OPEN_SCALE + (1 - RAY_OPEN_SCALE) * open + swell
		this.rayNode.scale.set(Math.round(size / RAY_SCALE_STEP) * RAY_SCALE_STEP)
		this.rayFade += (1 - this.rayFade) * Math.min(1, dt * 7)
		const spin = dt * RAY_SPIN * burstSpin(tier) * (1 + RAY_OPEN_SPIN * (1 - open))
		this.raySpin = Math.round((this.raySpin + spin) / RAY_STEP) * RAY_STEP
		this.rayNode.rotation = this.raySpin
		this.applyRayAlpha()
	}

	/**
	 * Lights the catch, once the fish has stopped over the angler's head.
	 *
	 * It is dropped at the landing spot rather than left wherever the arc began:
	 * the burst belongs to the fish that is being held up, and the next frames
	 * carry it along with the fish's idle wobble.
	 */
	private lightCatch(): void {
		this.rayOpen = 0
		this.rayFade = 0
		this.rayNode.position.set(this.catchSpot.x, this.catchSpot.y)
		this.rayNode.rotation = this.raySpin
		this.rayNode.scale.set(RAY_OPEN_SCALE)
		this.rayNode.visible = true
		this.applyRayAlpha()
	}

	private applyRayAlpha(): void {
		// A slow breath, so the light is alive without pulsing like a warning.
		const breath = 0.92 + Math.sin(this.time * 2.1) * 0.08
		this.rayNode.alpha = this.rayFade * this.rayDim * 0.9 * breath
	}

	protected clearHeldFish(): void {
		// The coat comes off before its sprite goes: the filter is kept for the next
		// shiny, but it must not be left pointing at a destroyed display object.
		if (this.shinySprite) {
			this.shinySprite.filters = []
			this.shinySprite = null
		}
		if (this.pearlReveal) {
			this.pearlReveal.destroy({ children: true })
			this.pearlReveal = null
		}
		if (this.heldFish) {
			this.heldFish.destroy()
			this.heldFish = null
		}
		this.pendingPearl = null
		this.catchLanded = false
		this.screenFlash = 0
		if (this.flashG) this.flashG.alpha = 0
		this.heldFishTime = 0
		this.rayFade = 0
		this.rayOpen = 0
		this.rayNode.alpha = 0
		this.rayNode.visible = false
		this.rayNode.scale.set(RAY_OPEN_SCALE)
	}

	// ---------------------------------------------------------------- internal
	protected updateJumps(dt: number): void {
		const caughtX = this.catchSpot.x
		const caughtY = this.catchSpot.y
		this.jumps = this.jumps.filter((jump) => {
			jump.t += dt / jump.duration
			if (jump.t >= 1) {
				if (jump.hold) {
					jump.sprite.position.set(caughtX, caughtY)
					jump.sprite.scale.set(jump.scale)
					jump.sprite.rotation = 0
					jump.sprite.alpha = 1
					this.heldFish = jump.sprite
					this.heldFishTime = 0
					this.catchLanded = true
					this.lightCatch()
					this.spawnSplash(this.layout.angler.x, this.layout.angler.y - 30, 4, 0.35)
					if (this.pendingPearl) this.startPearlReveal()
				} else {
					jump.sprite.destroy()
				}
				return false
			}
			const t = jump.t
			const arc = Math.sin(Math.PI * Math.min(1, t))
			jump.sprite.x = lerp(jump.fromX, caughtX, t)
			jump.sprite.y = lerp(jump.fromY, caughtY, t) - arc * 46
			jump.sprite.rotation = Math.sin(t * Math.PI * 3) * 0.25 + jump.spin * t
			jump.sprite.alpha = jump.hold ? 1 : t > 0.85 ? (1 - t) / 0.15 : 1
			// The burst is not drawn during the arc: it belongs to the fish held over
			// the angler, and it lights up in `lightCatch` when the arc ends.
			return true
		})
	}

	protected updateHeldFish(dt: number): void {
		this.updateScreenFlash(dt)
		// The coat runs from the moment the fish leaves the water, not from the
		// landing: the arc already glows, which is what makes the catch readable as
		// shiny during the one second it is moving.
		if (this.shinySprite) this.shiny?.advance(dt)
		if (this.pearlReveal) {
			this.pearlReveal.advance(dt)
			// The reveal draws its own shell/pearl at the catch point; the rays stay
			// with it instead of following the hidden shell sprite.
			this.updateRays(dt, this.catchSpot.x, this.catchSpot.y)
			return
		}
		if (!this.heldFish) return
		this.heldFishTime += dt
		this.heldFish.x = this.catchSpot.x + Math.sin(this.heldFishTime * 1.7) * 1.2
		this.heldFish.y = this.catchSpot.y + Math.sin(this.heldFishTime * 3.4) * 2
		this.heldFish.rotation = Math.sin(this.heldFishTime * 2.2) * 0.06
		this.updateRays(dt, this.heldFish.x, this.heldFish.y)
	}
}

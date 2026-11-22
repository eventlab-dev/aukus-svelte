import { Container, Graphics, Texture, TilingSprite, type DestroyOptions } from 'pixi.js'
import { VIEW } from '../../config'
import type { SurfaceDrift, WaterLook } from './waterLook'
import { bakeBreathTile, bakeCausticTile, bakeGlitterTile } from './waterTex'
import { readWaterEdge, type FoamSpeck } from './waterMask'
import { paintFoam, paintGlints, readGlints, type Glint } from './waterPixels'

const TAU = Math.PI * 2

/** Hard cap on foam specks: the shore needs a set of pixels, not all of them. */
const FOAM_LIMIT = 320

/**
 * The layer the dev inspector tunes.
 *
 * One scene is alive at a time, and the inspector only ever wants the water the
 * player is looking at, so the last built layer is kept here instead of threaded
 * through the screen layer: `P` is a tool, not part of the game seam.
 */
let liveLayer: PixelWater | null = null

/** The water layer in the current scene, or null before a scene is built. */
export function liveWaterLayer(): PixelWater | null {
	return liveLayer
}

/** Records the layer the dev inspector tunes. */
function setLiveLayer(layer: PixelWater | null): void {
	liveLayer = layer
}

export interface PixelWaterOptions {
	look: WaterLook
	/**
	 * The body's shoreline. Everything this layer draws is clipped to the water
	 * side of it; props standing in the water are painted above the layer, so
	 * they need no hole of their own.
	 */
	isShore: (x: number, y: number) => boolean
}

/**
 * Textured water: two parallax nets of caustics, a sparse glitter sheet, rare
 * sun glints and the foam that breaks along the shore.
 *
 * The static world already paints the depth ramp, and the surface motion draws
 * the crests; this sits between them. Everything here is a tiled texture or a
 * bounded set of pixels clipped to the water mask, so a frame costs four tile
 * offsets and a few hundred rectangles instead of repainting the surface.
 */
export class PixelWater extends Container {
	/**
	 * The resolved look this layer draws with.
	 *
	 * Public on purpose: the dev inspector (`P`) turns these numbers while the
	 * water runs, and the layer re-reads the ones it can apply without a re-bake
	 * every frame. Colours and the foam speck set are baked, so those need a scene
	 * rebuild — the inspector says so instead of pretending otherwise.
	 */
	readonly look: WaterLook
	/** Animation speed multiplier; 1 is the tuned pace, 0 freezes the surface. */
	speed = 1
	private readonly caustics: TilingSprite[] = []
	/** Broad light under the nets; only a still body builds it. */
	private readonly breath: TilingSprite | null
	private readonly glitter: TilingSprite
	private readonly glints = new Graphics()
	private readonly glintList: Glint[] = []
	private readonly foam = new Graphics()
	private readonly specks: FoamSpeck[]
	/** Strength of each speck this frame, indexed like {@link specks}. */
	private readonly levels: Uint8Array
	/** Baked textures, owned here and released with the layer. */
	private readonly baked: Texture[] = []

	constructor(options: PixelWaterOptions) {
		super()
		this.look = options.look
		setLiveLayer(this)

		const edge = readWaterEdge({
			isShore: options.isShore,
			width: VIEW.width,
			height: VIEW.height,
			share: options.look.foamShare,
			limit: FOAM_LIMIT,
			inset: options.look.foamInset,
			minPeriod: options.look.foamMinPeriod,
			maxPeriod: options.look.foamMaxPeriod
		})
		this.specks = edge.foam
		this.levels = new Uint8Array(this.specks.length)

		// The broad pass goes under everything: it is the light the water lies in,
		// not a pattern on it. Its tile is four caustic tiles across, so that at its
		// own small scale it still covers the frame once. A body with a current
		// leaves the pass off.
		this.breath =
			options.look.breathAlpha > 0
				? this.layer(
						bakeBreathTile(options.look.tile * 4, 7.3, options.look.breath),
						options.look.breathScale,
						0
					)
				: null

		// The broad net sits deep and the fine one rides over it: two scales moving
		// at different speeds and slightly different angles, which is what gives the
		// surface its parallax.
		this.caustics.push(
			this.tile({
				size: options.look.tile,
				seed: 0.4,
				color: options.look.deep,
				scale: options.look.farScale,
				alpha: options.look.farAlpha
			}),
			this.tile({
				size: options.look.tile,
				seed: 3.1,
				color: options.look.shallow,
				scale: options.look.nearScale,
				alpha: options.look.nearAlpha
			})
		)
		// A coarser tile than the caustics: at 64 px the sparkles line up on a grid
		// the moment the sheet starts moving.
		this.glitter = this.tile({
			size: options.look.tile * 2,
			seed: 4,
			color: options.look.glint,
			scale: options.look.glitterScale,
			alpha: options.look.glitterAlpha,
			glitter: true
		})

		this.glintList.push(...readGlints(options.look, options.isShore))

		// The stencil is the water itself, so no layer can reach the bank, the ice
		// or a prop. A Graphics mask is a stencil mask: no extra render target, and
		// it still draws on the Canvas renderer, where a sprite mask needs the
		// filter pipeline.
		this.addChild(edge.clip)
		if (this.breath) this.addChild(this.breath)
		for (const caustic of this.caustics) this.addChild(caustic)
		this.addChild(this.glitter, this.glints, this.foam)
		this.mask = edge.clip
		this.eventMode = 'none'
	}

	/** A tiling layer over the whole frame, baked from a seeded tile. */
	private tile(spec: {
		size: number
		seed: number
		color: number
		scale: number
		alpha: number
		glitter?: boolean
	}): TilingSprite {
		const texture = spec.glitter
			? bakeGlitterTile(spec.size, spec.seed, spec.color)
			: bakeCausticTile(spec.size, spec.seed, spec.color)
		return this.layer(texture, spec.scale, spec.alpha)
	}

	/** Wraps a baked texture in a tiling layer and takes ownership of it. */
	private layer(texture: Texture | null, scale: number, alpha: number): TilingSprite {
		const safe = texture ?? Texture.EMPTY
		if (safe !== Texture.EMPTY) this.baked.push(safe)
		return new TilingSprite({
			texture: safe,
			width: VIEW.width,
			height: VIEW.height,
			tileScale: { x: scale, y: scale },
			alpha
		})
	}

	/**
	 * One frame: drift the three sheets, twinkle the glints, break the foam.
	 * `time` is the scene clock in seconds, so the layer needs no delta of its
	 * own and a preview frame looks like a played one.
	 *
	 * Scale and opacity are read from the look here rather than baked at build
	 * time: the dev inspector (`P`) turns them while the water is running, and a
	 * re-bake per slider step would be a texture upload for every click.
	 */
	update(time: number): void {
		// One clock for everything the layer animates, so the inspector's speed knob
		// slows the whole surface at once: at 0 it freezes, at 1 it is tuned.
		const t = time * this.speed
		for (let i = 0; i < this.caustics.length; i += 1) {
			const far = i === 0
			const sprite = this.caustics[i]
			const scale = far ? this.look.farScale : this.look.nearScale
			sprite.tileScale.set(scale, scale)
			sprite.alpha = far ? this.look.farAlpha : this.look.nearAlpha
			// A phase apart, so the two nets never rock together as one sheet.
			this.scroll(
				sprite,
				far ? this.look.farDrift : this.look.nearDrift,
				far ? this.look.farSway : this.look.nearSway,
				t,
				this.look.tile * scale,
				far ? 0 : 0.9,
				this.look.swayPeriod
			)
		}
		this.glitter.tileScale.set(this.look.glitterScale, this.look.glitterScale)
		this.scroll(
			this.glitter,
			this.look.glitterDrift,
			this.look.glitterSway,
			t,
			this.look.tile * 2 * this.look.glitterScale,
			1.9,
			this.look.swayPeriod
		)
		// The sheet itself only breathes: a whole-tile fade in and out would read as
		// a flickering overlay, and the twinkle of a single pixel lives in `glints`.
		const shimmer = 0.72 + 0.28 * Math.sin((t / this.look.glitterPeriod) * TAU)
		this.glitter.alpha = this.look.glitterAlpha * shimmer
		if (this.breath) {
			// The broad pass does not drift with the rest: it brightens and dims as
			// one body, and the patches slide on their own slow cycle, so a still
			// surface swells instead of travelling.
			const swell = 0.25 + 0.75 * (0.5 - 0.5 * Math.cos((t / this.look.breathPeriod) * TAU))
			this.breath.tileScale.set(this.look.breathScale, this.look.breathScale)
			this.breath.alpha = this.look.breathAlpha * swell
			this.scroll(
				this.breath,
				{ x: 0, y: 0 },
				this.look.breathSway,
				t,
				this.look.tile * 4 * this.look.breathScale,
				2.7,
				this.look.breathPeriod
			)
		}

		paintGlints(this.glints, this.glintList, this.look, t)
		paintFoam(this.foam, this.specks, this.levels, this.look, t)
	}

	/**
	 * Places one sheet for this frame: a steady drift for a body with a current,
	 * a slow rock in place for still water, both at once when a body has a little
	 * of each.
	 *
	 * The offset is wrapped into a tile and rounded to whole pixels: the grid has
	 * to stay crisp, and an unbounded offset would lose precision over a long
	 * session anyway.
	 */
	private scroll(
		sprite: TilingSprite,
		drift: SurfaceDrift,
		sway: SurfaceDrift,
		time: number,
		span: number,
		phase: number,
		period: number
	): void {
		const rock = Math.sin((time / period) * TAU + phase)
		const wrap = (value: number): number => {
			const offset = ((value % span) + span) % span
			return Math.round(offset)
		}
		sprite.tilePosition.set(
			wrap(-drift.x * time + sway.x * rock),
			wrap(-drift.y * time + sway.y * rock)
		)
	}

	/** The body's current, read by the aurora reflection. */
	get current(): SurfaceDrift {
		return this.look.nearDrift
	}

	/** Releases the baked tiles with the layer: nothing else references them. */
	override destroy(options?: DestroyOptions): void {
		if (liveLayer === this) setLiveLayer(null)
		this.mask = null
		for (const texture of this.baked) texture.destroy(true)
		this.baked.length = 0
		super.destroy(options)
	}
}

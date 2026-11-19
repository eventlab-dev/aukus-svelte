import { Container, Sprite, Texture } from 'pixi.js'
import { VIEW } from '../config'
import { clamp } from '../utils'

/**
 * Fog: the pale, out-of-focus cloud bank that closes in during fog weather.
 *
 * The visible pocket is built around the angler, not around the frame: in thick
 * fog the player can see the water he is fishing and little else, and the bank
 * thickens with distance from him. When the front passes the layer hides
 * itself, so clear and snowy weather keep the plain scene.
 *
 * The cloud field is generated into a small canvas and upscaled with linear
 * filtering, which is what produces the blurred, lobed silhouette of the
 * reference. Two layers with different noise seeds and pocket sizes give it
 * depth; both drift a couple of pixels so the bank breathes without the pocket
 * sliding around.
 */

/** One texel per this many scene pixels; upscaling with linear filtering blurs. */
const TEXTURE_DIVISOR = 2
/**
 * Scene pixels of fog painted beyond each frame edge.
 *
 * The banks drift a few pixels, so a sprite sized exactly to the frame leaves a
 * transparent strip on the side it drifts away from — a hard vertical cut at
 * the screen edge in the middle of the fog. The texture is generated this much
 * larger and the sprite is overhung by the same amount, so the drift only ever
 * moves fog that is already outside the frame.
 */
const FOG_MARGIN = 14
/** Cloud density is measured on a grid this many texels wide. */
const LATTICE = 7
/** Vertical squash: fog banks are wider than they are tall. */
const SQUASH = 1.16

/**
 * Half-axes of the clear pocket around the angler, in frame fractions.
 *
 * Halved from the old 0.37 × 0.42: the bank is meant to close in until the
 * angler can read the float and a little of the water around it, not half the
 * lake. The pocket is measured on the frame, so this is also the radius the
 * player actually sees.
 */
const HOLE_RX = 0.185
const HOLE_RY = 0.21

interface FogLayerDef {
	seed: number
	/** Share of the density this layer carries. */
	weight: number
	/** Inner and outer edge of the clear pocket, in normalized radius. */
	inner: number
	outer: number
	/** Drift amplitude and speed, in scene pixels / seconds. */
	drift: number
	speed: number
}

const LAYERS: readonly FogLayerDef[] = [
	{
		seed: 7,
		weight: 1,
		inner: 0.72,
		outer: 1.62,
		drift: 2.4,
		speed: 0.07
	},
	// A second, softer bank: it starts a little further out and fades later, and
	// drifts the other way, so the two silhouettes never read as one texture.
	{
		seed: 41,
		weight: 0.55,
		inner: 0.9,
		outer: 1.86,
		drift: 4.2,
		speed: -0.045
	}
]

/** Focus the pocket is built around, quantised so it caches across frames. */
const FOCUS_STEP = 0.02

const textureCache = new Map<string, Texture>()

/** Deterministic 0..1 hash of a lattice point. */
function hash2(ix: number, iy: number, seed: number): number {
	let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 1442695041)
	h = Math.imul(h ^ (h >>> 13), 1274126177)
	return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Smoothly interpolated value noise on an integer lattice. */
function noise2(x: number, y: number, seed: number): number {
	const ix = Math.floor(x)
	const iy = Math.floor(y)
	const fx = x - ix
	const fy = y - iy
	const sx = fx * fx * (3 - 2 * fx)
	const sy = fy * fy * (3 - 2 * fy)
	const top = hash2(ix, iy, seed)
	const topRight = hash2(ix + 1, iy, seed)
	const bottom = hash2(ix, iy + 1, seed)
	const bottomRight = hash2(ix + 1, iy + 1, seed)
	const upper = top + (topRight - top) * sx
	const lower = bottom + (bottomRight - bottom) * sx
	return upper + (lower - upper) * sy
}

/** Fractal sum of {@link noise2}; `freq` is the lattice width of the frame. */
function fbm(u: number, v: number, seed: number, freq: number, octaves: number): number {
	let sum = 0
	let amplitude = 1
	let total = 0
	let scale = freq
	for (let i = 0; i < octaves; i += 1) {
		sum += noise2(u * scale, v * scale, seed + i * 31) * amplitude
		total += amplitude
		amplitude *= 0.5
		scale *= 2.1
	}
	return sum / total
}

function smoothstep(edge0: number, edge1: number, value: number): number {
	const t = clamp((value - edge0) / (edge1 - edge0))
	return t * t * (3 - 2 * t)
}

/** Builds the cloud bank for one layer: white where the haze is thick. */
function createFogTexture(def: FogLayerDef, focus: { x: number; y: number }): Texture {
	const width = Math.ceil((VIEW.width + FOG_MARGIN * 2) / TEXTURE_DIVISOR)
	const height = Math.ceil((VIEW.height + FOG_MARGIN * 2) / TEXTURE_DIVISOR)
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	if (!ctx) return Texture.WHITE

	const image = ctx.createImageData(width, height)
	const data = image.data
	for (let py = 0; py < height; py += 1) {
		// Texel centres are mapped back to scene pixels, with the margin taking
		// negative coordinates: the pocket then keeps its exact place on the frame
		// even though the texture extends past it.
		const v = ((py + 0.5) * TEXTURE_DIVISOR - FOG_MARGIN) / VIEW.height
		const dy = (v - focus.y) / HOLE_RY
		for (let px = 0; px < width; px += 1) {
			const u = ((px + 0.5) * TEXTURE_DIVISOR - FOG_MARGIN) / VIEW.width
			const dx = (u - focus.x) / HOLE_RX
			// Two noise fields: broad lobes plus a finer break-up at their edges.
			const base = fbm(u * 0.85, v * SQUASH, def.seed, LATTICE, 4)
			const detail = fbm(u * 1.9, v * SQUASH * 1.9, def.seed + 137, 9, 3)
			// Remapped around the noise field's own mean: the bank has to read as
			// separate lobes with thinner air between them, not as one even wash.
			// The floor keeps the thin air hazy too — at zero the gaps read as holes
			// punched in the fog rather than as slack in the bank.
			const cloud = smoothstep(0.3, 0.64, base * 0.78 + detail * 0.22)
			// The pocket is an ellipse around the angler, and its edge is pushed
			// around by the same noise, so it is ragged rather than a clean oval with
			// fog sprayed around it.
			const radius = Math.hypot(dx, dy) + (base - 0.5) * 0.16
			const vignette = smoothstep(def.inner, def.outer, radius)
			if (vignette <= 0.001) continue
			const alpha = clamp(vignette * (0.42 + 0.58 * cloud)) * def.weight
			const offset = (py * width + px) * 4
			data[offset] = 255
			data[offset + 1] = 255
			data[offset + 2] = 255
			data[offset + 3] = Math.round(alpha * 255)
		}
	}
	ctx.putImageData(image, 0, 0)

	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'linear'
	return texture
}

function fogTexture(def: FogLayerDef, focus: { x: number; y: number }): Texture {
	const key = `${def.seed}:${Math.round(focus.x / FOCUS_STEP)}:${Math.round(focus.y / FOCUS_STEP)}`
	const cached = textureCache.get(key)
	if (cached) return cached
	const texture = createFogTexture(def, focus)
	textureCache.set(key, texture)
	return texture
}

/** Draws the two cloud banks and keeps them drifting. */
export class FogLayer extends Container {
	private readonly sprites: { sprite: Sprite; def: FogLayerDef }[] = []
	private time = 0
	/** Centre of the clear pocket, in frame fractions. */
	private focus = { x: 0.5, y: 0.5 }
	private focusKey = ''

	constructor() {
		super()
		this.eventMode = 'none'
		for (const def of LAYERS) {
			const sprite = new Sprite(fogTexture(def, this.focus))
			// Overhung by the margin on every side, so the drift never exposes the
			// frame edge.
			sprite.width = VIEW.width + FOG_MARGIN * 2
			sprite.height = VIEW.height + FOG_MARGIN * 2
			sprite.position.set(-FOG_MARGIN, -FOG_MARGIN)
			sprite.eventMode = 'none'
			this.addChild(sprite)
			this.sprites.push({ sprite, def })
		}
	}

	/**
	 * Moves the clear pocket onto the angler. Rebuilding only happens when the
	 * centre actually moves, which is once per location.
	 */
	setFocus(x: number, y: number): void {
		const focus = {
			x: clamp(x / VIEW.width),
			y: clamp(y / VIEW.height)
		}
		const key = `${Math.round(focus.x / FOCUS_STEP)}:${Math.round(focus.y / FOCUS_STEP)}`
		if (key === this.focusKey) return
		this.focusKey = key
		this.focus = focus
		for (const { sprite, def } of this.sprites) {
			sprite.texture = fogTexture(def, focus)
		}
	}

	/**
	 * @param density 0..1 haze amount; the caller gates it to fog weather, so 0
	 * hides the whole layer.
	 * @param tint Colour the mist takes on; a pale, cold white — winter fog is
	 * frozen air catching the light, not a dark cloud.
	 */
	setDensity(density: number, tint: number): void {
		const strength = clamp(density)
		const fade = strength * (0.8 + 0.2 * strength)
		for (const { sprite, def } of this.sprites) {
			sprite.tint = tint
			sprite.alpha = fade * (def.weight >= 1 ? 1 : def.weight) * 0.92
		}
		this.visible = strength > 0.01
	}

	/** Slow breathing drift; the clearing itself stays put. */
	tick(dt: number): void {
		this.time += dt
		for (const { sprite, def } of this.sprites) {
			const phase = this.time * def.speed
			sprite.position.set(
				-FOG_MARGIN + Math.sin(phase) * def.drift,
				-FOG_MARGIN + Math.cos(phase * 0.73) * def.drift * 0.6
			)
		}
	}
}

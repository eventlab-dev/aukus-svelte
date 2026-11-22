import { Texture } from 'pixi.js'

const TAU = Math.PI * 2

/** One wave train of the interference that makes a caustic net. */
interface Train {
	/** Whole-number frequencies: a tile only wraps when its waves do. */
	kx: number
	ky: number
	weight: number
	phase: number
}

/**
 * Four trains at different angles. Fewer make loops instead of a net, more
 * turn the net into noise; four is the point where the cancellations cross and
 * leave the cell walls caustics are.
 */
const TRAINS: readonly Train[] = [
	{ kx: 3, ky: 8, weight: 1, phase: 0 },
	{ kx: 6, ky: -5, weight: 0.85, phase: 1.9 },
	{ kx: -5, ky: 11, weight: 0.6, phase: 4.1 },
	{ kx: 8, ky: 14, weight: 0.35, phase: 2.7 }
]

const WEIGHT_SUM = TRAINS.reduce((sum, train) => sum + train.weight, 0)

/**
 * Where the sum cancels, the light focuses: the net is the zero band of the
 * interference, so a pixel's brightness is how close its sum came to zero.
 * `CORE` is the bright ridge, `HALO` the dim shoulder that keeps the ridge
 * from reading as a one-pixel scratch.
 */
const CORE = 0.11
const HALO = 0.28

/** Deterministic 0..1 hash — the same kind of noise the painted water uses. */
function hash(a: number, b: number): number {
	const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
	return value - Math.floor(value)
}

/** Append a texel of `color`; `alpha` is what the layers scale down to. */
function put(data: Uint8ClampedArray, index: number, color: number, alpha: number): void {
	data[index] = (color >> 16) & 0xff
	data[index + 1] = (color >> 8) & 0xff
	data[index + 2] = color & 0xff
	data[index + 3] = alpha
}

/** A baked tile as a nearest-neighbour texture, or null without a 2D context. */
function bake(size: number, paint: (data: Uint8ClampedArray) => void): Texture | null {
	const canvas = document.createElement('canvas')
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext('2d')
	if (!ctx) return null
	const image = ctx.createImageData(size, size)
	paint(image.data)
	ctx.putImageData(image, 0, 0)
	const texture = Texture.from(canvas)
	// The whole point of the tile: scaled up, its texels stay square and hard.
	texture.source.scaleMode = 'nearest'
	return texture
}

/**
 * One seamless tile of caustics: the interference of four wave trains, cut at
 * the zero band so only the focused ridges are lit.
 *
 * `seed` only rotates the phases, so the two nets of a water body are the same
 * kind of pattern at different scales instead of two unrelated textures.
 */
export function bakeCausticTile(size: number, seed: number, color: number): Texture | null {
	return bake(size, (data) => {
		for (let y = 0; y < size; y += 1) {
			for (let x = 0; x < size; x += 1) {
				let sum = 0
				for (let i = 0; i < TRAINS.length; i += 1) {
					const train = TRAINS[i]
					const angle =
						(TAU * (train.kx * x + train.ky * y)) / size + train.phase + seed * (i + 1) * 1.37
					sum += Math.sin(angle) * train.weight
				}
				const distance = Math.abs(sum / WEIGHT_SUM)
				const base = distance < CORE ? 255 : distance < HALO ? 70 : 0
				if (base === 0) continue
				// A slow swell dims whole patches of the net. Without it every cell is
				// lit alike and the water reads as one printed sheet — but it has to
				// stay close to the cell scale, because a brightness pattern much
				// broader than a cell lines up with the tile seam and turns the repeat
				// into a visible grid.
				const swell =
					0.62 + 0.38 * (0.5 + 0.5 * Math.sin((TAU * (2 * x + 3 * y)) / size + seed * 0.9 + 1.3))
				// A handful of quantised strengths keep the net in the same limited
				// palette the painted water uses instead of a smooth 8-bit wash.
				const alpha = Math.min(255, Math.round((base * swell) / 24) * 24)
				put(data, (y * size + x) * 4, color, alpha)
			}
		}
	})
}

/**
 * Broad, low-frequency light for a still body of water: two long wave trains
 * whose sum is taken as wide soft patches instead of a net, so the tile reads
 * as light lying on the surface rather than as another texture.
 *
 * The tile is baked large and drawn at a small scale on purpose. Drawing a
 * small tile several times up put the patch edges on a five-pixel staircase,
 * which read as blocks of compression noise; a big tile at 2× lands them on the
 * same two-pixel step as the rest of the light, while one tile still covers
 * more than the frame and keeps its repeat out of sight.
 */
export function bakeBreathTile(size: number, seed: number, color: number): Texture | null {
	return bake(size, (data) => {
		for (let y = 0; y < size; y += 1) {
			for (let x = 0; x < size; x += 1) {
				// Only two trains, and both slow: three or more would cross into the
				// cell net the caustics already are.
				const a = Math.sin((TAU * (3 * x + 7 * y)) / size + seed * 0.7 + 0.4)
				const b = Math.sin((TAU * (7 * x - 3 * y)) / size + seed * 1.9 + 2.3)
				const light = (a * 0.6 + b * 0.4 + 1) / 2
				// A wide band near the crest, then three levels: soft enough to be
				// light, stepped enough to stay on the pixel grid.
				const alpha = light > 0.78 ? 255 : light > 0.52 ? 120 : light > 0.3 ? 48 : 0
				if (alpha === 0) continue
				put(data, (y * size + x) * 4, color, alpha)
			}
		}
	})
}

/** Texels per sparkle. Sparse: this is sunlight, not confetti. */
const GLINT_AREA = 3400

/**
 * Sparse sheet of sun glints: a few single bright texels on an empty tile. The
 * sheet is what makes the surface glitter as it drifts; the twinkle of a single
 * pixel is `PixelWater`'s own business, because a tiling sprite can only fade
 * as a whole.
 */
export function bakeGlitterTile(size: number, seed: number, color: number): Texture | null {
	const count = Math.max(3, Math.round((size * size) / GLINT_AREA))
	return bake(size, (data) => {
		for (let i = 0; i < count; i += 1) {
			// Spread over the tile with a hash rather than a lattice: evenly spaced
			// glints read as a printed grid once the sheet starts moving.
			const x = Math.floor(hash(i + 1, seed) * size)
			const y = Math.floor(hash(seed, i + 3) * size)
			const bright = 0.55 + hash(i + 5, seed + 2) * 0.45
			put(data, (y * size + x) * 4, color, Math.round(bright * 255))
		}
	})
}

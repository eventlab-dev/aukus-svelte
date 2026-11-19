import { Graphics } from 'pixi.js'

/** One foam speck sitting on the waterline. */
export interface FoamSpeck {
	x: number
	y: number
	/** Second pixel along the waterline, or -1 when the speck has no room. */
	tailX: number
	tailY: number
	/** Pixel just inside the water for the shadow under the foam, or -1. */
	shadeX: number
	shadeY: number
	/** Offset into the speck's own rise-and-break cycle, 0..1. */
	phase: number
	/** Seconds for one cycle. */
	period: number
}

export interface WaterEdge {
	/**
	 * The water as a stencil: one rectangle per run of water pixels in a row.
	 * A Graphics is a stencil mask, which is what keeps the tiled layers off the
	 * bank without a per-frame mask pass or a filter.
	 */
	clip: Graphics
	/** Bounded set of foam specks, spread along the waterline. */
	foam: FoamSpeck[]
}

/** Water pixels are 1, dry pixels 0 — the grid every rule below works on. */
type Mask = Uint8Array

/** Deterministic 0..1 hash, so a reloaded scene foams in the same places. */
function hash(a: number, b: number): number {
	const value = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453
	return value - Math.floor(value)
}

/**
 * Samples the shoreline into the water mask: everything the shore is not.
 *
 * The body's `isWater` is deliberately *not* used here. It also excludes the
 * boxes around the pier, the moored boat and the skiff so ripples do not run
 * over them, and those boxes are rectangles several pixels larger than the
 * prop. Clipping the texture to them cut a visible rectangular hole into the
 * water around every boat. The props are drawn above this layer anyway, so the
 * texture only has to stop at the bank.
 */
function readMask(isShore: (x: number, y: number) => boolean, width: number, height: number): Mask {
	const mask = new Uint8Array(width * height)
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			if (!isShore(x + 0.5, y + 0.5)) mask[y * width + x] = 1
		}
	}
	return mask
}

/**
 * Foam only follows the body's own shoreline, never everything `isWater`
 * rejects: the water test also excludes the boxes around the pier, the moored
 * boat and the skiff so waves do not run over them, and those boxes are dry
 * islands inside the water. Foam around such a box would trace a rectangle a
 * few pixels off the planks — the box, not the prop — so the renderer states its
 * shoreline separately and foam against a prop is left to the prop's own
 * contact shadow.
 */

/** Runs of water pixels, one rectangle per run: the stencil geometry. */
function buildClip(mask: Mask, width: number, height: number): Graphics {
	const clip = new Graphics()
	for (let y = 0; y < height; y += 1) {
		let x = 0
		while (x < width) {
			if (!mask[y * width + x]) {
				x += 1
				continue
			}
			let end = x
			while (end < width && mask[y * width + end]) end += 1
			clip.rect(x, y, end - x, 1)
			x = end
		}
	}
	// One fill for the whole body of water: the stencil only reads the geometry,
	// so this is a single batch of rectangles rather than one shape per run.
	clip.fill(0xffffff)
	return clip
}

const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1]
] as const

/** Water pixels that touch the shoreline, in row order, with an outward normal. */
function readWaterline(
	mask: Mask,
	isShore: (x: number, y: number) => boolean,
	width: number,
	height: number
) {
	const line: Array<{ x: number; y: number; nx: number; ny: number }> = []
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			if (!mask[y * width + x]) continue
			let nx = 0
			let ny = 0
			for (const [dx, dy] of NEIGHBOURS) {
				const sx = x + dx
				const sy = y + dy
				if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue
				if (isShore(sx + 0.5, sy + 0.5)) {
					nx += dx
					ny += dy
				}
			}
			if (nx === 0 && ny === 0) continue
			// A corner (two dry neighbours) gets a diagonal normal, so the foam of a
			// ragged shore pushes out the way the bank actually runs.
			const length = Math.hypot(nx, ny) || 1
			line.push({ x, y, nx: nx / length, ny: ny / length })
		}
	}
	return line
}

/**
 * Turns the water test and the shoreline into the two things a textured surface
 * needs: a stencil that keeps every layer on the water, and a bounded set of
 * foam specks along the waterline.
 *
 * Every waterline pixel would be a few thousand specks on the river's two
 * banks; the shore only needs enough of them to read as a broken edge, so the
 * line is thinned by a stride with a hash jitter — even spacing would look
 * combed, and a plain random pick clumps.
 */
export function readWaterEdge(options: {
	/**
	 * The body's shoreline: bank, far shore or snowfield. Everything else is
	 * water as far as this layer is concerned — the props standing in the water
	 * are painted above it and need no hole.
	 */
	isShore: (x: number, y: number) => boolean
	width: number
	height: number
	/** Share of the waterline that carries a speck, 0..1. */
	share: number
	/** Hard cap on specks, whatever the share works out to. */
	limit: number
	/** How far into the water a speck sits, in pixels. */
	inset: number
	/** Bounds of one speck's rise-and-break, in seconds. */
	minPeriod: number
	maxPeriod: number
}): WaterEdge {
	const { width, height } = options
	const mask = readMask(options.isShore, width, height)
	const line = readWaterline(mask, options.isShore, width, height)
	const wanted = Math.min(options.limit, Math.round(line.length * options.share))
	const stride = line.length / Math.max(1, wanted)
	const foam: FoamSpeck[] = []

	for (let i = 0; i < wanted; i += 1) {
		const spot = line[Math.min(line.length - 1, Math.floor(i * stride + hash(i, 7) * stride))]
		if (!spot) continue
		// The ice shelf is painted over the first water pixels, so the speck steps
		// out onto open water first; if the shore is too narrow for that, it stays
		// on the boundary rather than jumping to the far side of a narrow neck.
		let sx = spot.x
		let sy = spot.y
		for (let step = 1; step <= options.inset; step += 1) {
			const nx = Math.round(spot.x - spot.nx * step)
			const ny = Math.round(spot.y - spot.ny * step)
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) break
			if (mask[ny * width + nx] !== 1) break
			sx = nx
			sy = ny
		}
		// Tangent along the shore: where the speck spreads when it breaks.
		const tailX = sx + Math.round(-spot.ny)
		const tailY = sy + Math.round(spot.nx)
		const tailWet =
			tailX >= 0 &&
			tailY >= 0 &&
			tailX < width &&
			tailY < height &&
			mask[tailY * width + tailX] === 1
		const shadeX = sx - Math.round(spot.nx)
		const shadeY = sy - Math.round(spot.ny)
		const shadeWet =
			shadeX >= 0 &&
			shadeY >= 0 &&
			shadeX < width &&
			shadeY < height &&
			mask[shadeY * width + shadeX] === 1
		foam.push({
			x: sx,
			y: sy,
			tailX: tailWet ? tailX : -1,
			tailY: tailWet ? tailY : -1,
			shadeX: shadeWet ? shadeX : -1,
			shadeY: shadeWet ? shadeY : -1,
			// Every speck gets its own rhythm: a shore that pulses in unison reads as
			// a blinking outline, not as water working against the bank.
			phase: hash(spot.x, spot.y),
			period: options.minPeriod + hash(spot.y, spot.x) * (options.maxPeriod - options.minPeriod)
		})
	}
	return { clip: buildClip(mask, width, height), foam }
}

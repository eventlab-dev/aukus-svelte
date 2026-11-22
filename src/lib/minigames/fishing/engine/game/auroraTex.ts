import { Texture } from 'pixi.js'
import { VIEW } from '../config'
import { mixColor } from '../world'

const TAU = Math.PI * 2

/** Where the reflection sits on the frame, in virtual pixels. */
export const AURORA_REFLECTION = { top: 12, height: 100 } as const

/**
 * Soft water coverage for the reflection, in a coarse grid. The shoreline is
 * blurred before it reaches the texture, so the reflected light fades into the
 * bank instead of ending on the hard stencil edge.
 */
export interface WaterCoverage {
	data: Uint8Array
	width: number
	height: number
}

/**
 * Internal canvas width. The sheets are stretched to the 480 px frame, so a
 * texel is two screen pixels: the light is soft by nature and sharpening the
 * wave into a pixel step would make it read as a graphic, not as air.
 */
const WIDTH = 240

export interface AuroraSheetSpec {
	/** Height of the sheet on screen, in virtual pixels. */
	height: number
	/** Broad waves across the frame. */
	bands: number
	/** How far a ribbon may swing, as a share of the sheet height. */
	wave: number
	/** Phase speed, radians per second. Slow on purpose. */
	speed: number
	/** Shifts every harmonic, so the two sheets never share a silhouette. */
	phase: number
	/** Number of fine vertical rays across the frame. */
	rays: number
	/** Colour of the dense core and of the thin edges. */
	low: number
	high: number
}

/** The near curtain: short, sharp and mint. */
export const AURORA_NEAR: AuroraSheetSpec = {
	height: 50,
	bands: 4,
	wave: 0.28,
	speed: 0.055,
	phase: 4.2,
	rays: 13,
	low: 0x7dffd6,
	high: 0xc08aff
}

/** The far breath: wider, lower and violet. */
export const AURORA_FAR: AuroraSheetSpec = {
	height: 64,
	bands: 2,
	wave: 0.24,
	speed: 0.04,
	phase: 1.1,
	rays: 8,
	low: 0x4fe0cf,
	high: 0x9f7dff
}

function clamp01(value: number): number {
	return value < 0 ? 0 : value > 1 ? 1 : value
}

function smoothstep(edge0: number, edge1: number, value: number): number {
	const t = clamp01((value - edge0) / (edge1 - edge0))
	return t * t * (3 - 2 * t)
}

function wrap(value: number, length: number): number {
	const rest = value % length
	return rest < 0 ? rest + length : rest
}

/**
 * One animated aurora sheet, painted into a small canvas every frame.
 *
 * The old effect was a static tile scrolled sideways: the ribbons were fixed
 * and the only motion was the whole sheet sliding, which reads as a moving
 * picture rather than as light. Here the shape itself is a function of time —
 * the centre line, its thickness and its brightness all breathe on slow,
 * incommensurate phases — so the curtain undulates instead of travelling. The
 * sheet is also much shorter than the old band, so it hangs over the far shore
 * instead of covering half the lake.
 */
export class AuroraSheet {
	readonly texture: Texture
	readonly height: number
	/** Internal canvas height, in texels. */
	readonly rows: number
	/** Per-column values, read by the water reflection so it mirrors the sheet. */
	/** The painted RGBA buffer, read by the water reflection. */
	readonly pixels: Uint8ClampedArray | null

	private readonly spec: AuroraSheetSpec
	private readonly canvas: HTMLCanvasElement
	private readonly ctx: CanvasRenderingContext2D | null
	private readonly image: ImageData | null
	private readonly data: Uint8ClampedArray | null

	constructor(spec: AuroraSheetSpec) {
		this.spec = spec
		this.height = spec.height
		this.rows = Math.max(10, Math.round(spec.height / 2))
		this.canvas = document.createElement('canvas')
		this.canvas.width = WIDTH
		this.canvas.height = this.rows
		this.ctx = this.canvas.getContext('2d')
		this.image = this.ctx ? this.ctx.createImageData(WIDTH, this.rows) : null
		this.data = this.image?.data ?? null
		this.pixels = this.data
		this.texture = Texture.from(this.canvas)
		this.texture.source.scaleMode = 'linear'
	}

	/** Repaints the sheet for `time` seconds. Call only while it is visible. */
	update(time: number): void {
		const ctx = this.ctx
		const image = this.image
		const data = this.data
		if (!ctx || !image || !data) return

		const { bands, wave, speed, phase, rays, low, high } = this.spec
		const h = this.rows
		const t = time * speed

		// The buffer is reused between frames: pixels that fall below the threshold
		// this time would otherwise keep last frame's alpha and leave a ghost edge.
		data.fill(0)

		for (let x = 0; x < WIDTH; x += 1) {
			// `x / WIDTH`, and whole-number harmonics below: the sheet has to join
			// itself exactly, or the reflected copy shows the seam where it wraps.
			const u = x / WIDTH
			// Three harmonics: the first is the long swing, the other two keep the
			// edge from repeating as a clean sine.
			const sway =
				Math.sin(TAU * (u * bands + t + phase)) * 0.58 +
				Math.sin(TAU * (u * bands * 2 - t * 0.57 + phase * 1.7)) * 0.28 +
				Math.sin(TAU * (u * bands * 4 + t * 0.33 + phase * 2.3)) * 0.14
			const center = Math.max(
				h * 0.2,
				Math.min(h * 0.8, h * 0.48 + sway * h * wave)
			)
			const thickness =
				h *
				(0.2 +
					0.11 *
						(0.5 + 0.5 * Math.sin(TAU * (u * bands * 2 - t * 0.74 + phase * 1.3))))
			const bright =
				0.45 +
				0.55 *
					(0.5 + 0.5 * Math.sin(TAU * (u * bands + t * 0.31 + phase * 0.6)))
			const ray = 0.5 + 0.5 * Math.sin(TAU * (u * rays + t * 0.11))

			const violet = clamp01(
				0.14 +
					0.5 * Math.min(1, Math.abs(sway)) +
					0.22 * (1 - bright) +
					0.06 * Math.sin(TAU * (u * 2 - t * 0.21))
			)
			const color = mixColor(low, high, smoothstep(0.05, 0.92, violet))
			const cr = (color >> 16) & 0xff
			const cg = (color >> 8) & 0xff
			const cb = color & 0xff

			for (let y = 0; y < h; y += 1) {
				const dy = (y - center) / Math.max(1, thickness)
				const core = Math.exp(-dy * dy * 1.65)
				// A fainter echo below the core: one clean ribbon reads as a stripe,
				// two loose ones as a curtain.
				const echoDy = (y - center - h * 0.16) / Math.max(1, thickness * 1.35)
				const echo = Math.exp(-echoDy * echoDy * 1.8) * 0.34
				// The sheet is a sprite, not a tiling texture: without this the glow is
				// cut on the last row and the band ends on a straight line.
				const edge = smoothstep(0, 3, y) * (1 - smoothstep(h - 4, h - 1, y))
				const alpha = (core + echo) * bright * (0.55 + 0.45 * ray) * edge
				const index = (y * WIDTH + x) * 4
				data[index] = cr
				data[index + 1] = cg
				data[index + 2] = cb
				data[index + 3] = Math.round(clamp01(alpha) * 255)
			}
		}

		ctx.putImageData(image, 0, 0)
		this.texture.source.update()
	}
}

/**
 * The aurora as the water sees it: the same field, mirrored, compressed and
 * broken into horizontal ripples. It lives in the water layer, which already
 * owns the shoreline stencil, so the light stops at the bank instead of
 * tinting the snow.
 */
export class AuroraReflection {
	readonly texture: Texture
	readonly height: number
	readonly rows: number

	private readonly source: AuroraSheet
	private readonly canvas: HTMLCanvasElement
	private readonly ctx: CanvasRenderingContext2D | null
	private readonly image: ImageData | null
	private readonly data: Uint8ClampedArray | null
	/** Current of the water body, in world pixels per second. */
	private flowX = 0
	private flowY = 0

	constructor(source: AuroraSheet, height = 124) {
		this.source = source
		this.height = height
		this.rows = Math.max(12, Math.round(height / 2))
		this.canvas = document.createElement('canvas')
		this.canvas.width = WIDTH
		this.canvas.height = this.rows
		this.ctx = this.canvas.getContext('2d')
		this.image = this.ctx ? this.ctx.createImageData(WIDTH, this.rows) : null
		this.data = this.image?.data ?? null
		this.texture = Texture.from(this.canvas)
		this.texture.source.scaleMode = 'linear'
	}

	/** The reflection is carried by the current, not just mirrored in place. */
	setFlow(x: number, y: number): void {
		this.flowX = x
		this.flowY = y
	}

	update(time: number, coverage: WaterCoverage | null = null): void {
		const ctx = this.ctx
		const image = this.image
		const data = this.data
		if (!ctx || !image || !data) return

		const source = this.source
		const h = this.rows
		const t = time
		// The whole reflected sheet drifts downstream; the shear tilts the
		// ripples the way the current tilts the surface, so a river and a still
		// lake do not get the same reflection.
		const driftX = this.flowX * t * 0.5
		const shear = this.flowX * 0.16
		const driftY = this.flowY * 4

		// Same reused buffer as the sky sheet: clear it, or the previous frame's
		// ripples stay behind as a frozen band.
		data.fill(0)

		for (let y = 0; y < h; y += 1) {
			const v = y / (h - 1)
			// The reflection starts at the far shore, so its top has to fade in as
			// well; a hard first row drew a straight line across the lake.
			const fade = smoothstep(0, 0.1, v) * Math.pow(1 - v, 0.9)
			// Ripples are wider apart near the viewer: the same light is spread over
			// more water as it comes towards the angler.
			const rippleBase =
				0.3 + 0.7 * (0.5 + 0.5 * Math.sin(TAU * (v * 3.2 - t * 0.7)))
			const offset =
				driftX +
				v * shear +
				Math.sin(TAU * (v * 1.5 + t * 0.22 + 0.6)) * (0.5 + v * 3.5) +
				Math.sin(TAU * (v * 4.6 - t * 0.17)) * (0.2 + v * 1.4)
			const srcY = (1 - v * 0.9) * (source.rows - 1) + driftY
			const srcRow = Math.max(0, Math.min(source.rows - 1, Math.round(srcY)))
			const screenY =
				AURORA_REFLECTION.top + ((y + 0.5) / h) * AURORA_REFLECTION.height

			for (let x = 0; x < WIDTH; x += 1) {
				const u = x / WIDTH
				const sx = Math.round(
					wrap(
						x +
							offset +
							Math.sin(TAU * (v * 5 + u * 2 + t * 0.3)) * (0.6 + v * 1.8),
						WIDTH
					)
				)
				const pixels = source.pixels
				if (!pixels) continue
				const src = (srcRow * WIDTH + sx) * 4
				const sourceAlpha = pixels[src + 3] / 255
				if (sourceAlpha <= 0) continue
				// The ripple is a wave on the surface, not a row-wide dimmer: the
				// horizontal phase is what keeps the reflected band from going flat.
				const ripple =
					rippleBase *
					(0.5 +
						0.5 *
							(0.5 +
								0.5 * Math.sin(TAU * (v * 6 + u * 2 - t * 0.9))))
				const cover = coverage
					? sampleCoverage(
							coverage,
							((x + 0.5) / WIDTH) * VIEW.width,
							screenY
						)
					: 1
				const alpha = sourceAlpha * fade * ripple * cover * 1.4
				const color = mixColor(
					(pixels[src] << 16) | (pixels[src + 1] << 8) | pixels[src + 2],
					0x1b4f6b,
					0.15
				)
				const index = (y * WIDTH + x) * 4
				data[index] = (color >> 16) & 0xff
				data[index + 1] = (color >> 8) & 0xff
				data[index + 2] = color & 0xff
				data[index + 3] = Math.round(clamp01(alpha) * 255)
			}
		}

		ctx.putImageData(image, 0, 0)
		this.texture.source.update()
	}
}

/** Bilinear water coverage at a frame point, 0 (land) .. 1 (open water). */
function sampleCoverage(coverage: WaterCoverage, screenX: number, screenY: number): number {
	const gx = (screenX / VIEW.width) * coverage.width - 0.5
	const gy = (screenY / VIEW.height) * coverage.height - 0.5
	const x0 = Math.floor(gx)
	const y0 = Math.floor(gy)
	const fx = gx - x0
	const fy = gy - y0
	const at = (x: number, y: number): number => {
		const cx = x < 0 ? 0 : x >= coverage.width ? coverage.width - 1 : x
		const cy = y < 0 ? 0 : y >= coverage.height ? coverage.height - 1 : y
		return coverage.data[cy * coverage.width + cx] / 255
	}
	const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx
	const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx
	return top * (1 - fy) + bottom * fy
}

import { Sprite, Texture, type DestroyOptions } from 'pixi.js'
import { VIEW } from '../config'

/** How far the frost reaches in from the frame border, in virtual pixels. */
const FEATHER = 55

/** Share of the frost that stays even in the middle of the frame. */
const BASE = 0.55

/**
 * Decorative frost veil drawn over every screen — the first version.
 *
 * `public/assets/ice-480.webp` is the original 2560×1440 cut-out, pre-scaled to
 * the 480×270 frame by `scripts/bake-veil.mjs` with the very same canvas
 * downscale the game used to run at load: the silhouette is bit-for-bit the
 * same, only the file is 99 KB instead of 1.55 MB. Its alpha is rewritten per
 * pixel here: a faint film over the whole picture, thickening towards the frame
 * edge. The centre keeps enough of the ice to be there when the player looks
 * for it, but never enough to fight the interface copy sitting on top.
 *
 * The veil is decoration: when the file is missing the game boots without it.
 */
export class IceVeil extends Sprite {
	/** Overall strength of the frost; per-pixel fade lives in the baked alpha. */
	private static readonly ALPHA = 0.14

	private constructor(texture: Texture) {
		super(texture)
		this.width = VIEW.width
		this.height = VIEW.height
		this.alpha = IceVeil.ALPHA
		this.eventMode = 'none'
	}

	/**
	 * The veil is decoration: when the file is missing the game boots without it.
	 * `url` comes from the host's `publicBase`, so a nested route or a CDN works.
	 */
	static async load(url: string): Promise<IceVeil | null> {
		try {
			const image = new Image()
			image.decoding = 'async'
			// The veil is baked by reading the alpha back through `getImageData`, and
			// a cross-origin image without CORS taints the canvas. The error would be
			// swallowed by the guard below and the frost would silently vanish on a
			// CDN host, so the flag belongs here, next to the request.
			image.crossOrigin = 'anonymous'
			image.src = url
			await image.decode()
			const texture = bakeIceTexture(image)
			return texture ? new IceVeil(texture) : null
		} catch (error) {
			console.warn('[fishing] ice veil skipped', error)
			return null
		}
	}

	/**
	 * The baked texture belongs to this sprite alone (it is not in the asset
	 * cache), so tear it down with the veil instead of leaving it on the GPU.
	 */
	override destroy(options?: DestroyOptions): void {
		this.texture?.destroy(true)
		super.destroy(options)
	}
}

/**
 * Applies the edge fade to the ice texture's alpha.
 *
 * The texture is already at 480×270, so the draw is 1:1 and changes no pixel;
 * the only work is {@link BASE} in the middle, rising smoothly to 1 on the
 * border. Sampling is left to the sprite (nearest), which keeps the frost on
 * the same pixel grid as the rest of the art instead of looking like a soft
 * photo.
 *
 * Returns `null` when the browser cannot give us a 2D context; the veil is
 * optional and must never fall back to a shared texture that it would then
 * destroy on teardown.
 */
function bakeIceTexture(image: HTMLImageElement): Texture | null {
	const canvas = document.createElement('canvas')
	canvas.width = VIEW.width
	canvas.height = VIEW.height
	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) return null

	ctx.imageSmoothingEnabled = true
	ctx.drawImage(image, 0, 0, VIEW.width, VIEW.height)

	const frame = ctx.getImageData(0, 0, VIEW.width, VIEW.height)
	const data = frame.data
	for (let y = 0; y < VIEW.height; y += 1) {
		for (let x = 0; x < VIEW.width; x += 1) {
			const fade = edgeFade(x, y)
			const index = (y * VIEW.width + x) * 4 + 3
			data[index] = Math.round(data[index] * fade)
		}
	}
	ctx.putImageData(frame, 0, 0)

	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'nearest'
	return texture
}

/** 1 on the frame border, {@link BASE} in the middle of the frame. */
function edgeFade(x: number, y: number): number {
	const distance = Math.min(x, VIEW.width - 1 - x, y, VIEW.height - 1 - y) / FEATHER
	if (distance >= 1) return BASE
	const t = 1 - distance
	return BASE + (1 - BASE) * t * (3 - 2 * t)
}

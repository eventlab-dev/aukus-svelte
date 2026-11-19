import { Texture } from 'pixi.js'

export type CursorName = 'default' | 'pointer' | 'grab' | 'grabbing' | 'crosshair'

/** Tokens carried by Pixi event targets; the Pixi CursorOverlay renders them. */
export const CURSORS: Record<CursorName, CursorName> = {
	default: 'default',
	pointer: 'pointer',
	grab: 'grab',
	grabbing: 'grabbing',
	crosshair: 'crosshair'
}

export interface CursorTexture {
	texture: Texture
	/** Hotspot normalized to the 0..1 cursor box. */
	anchorX: number
	anchorY: number
	/** Display scale on top of the overlay scale; 1 draws the texture 1:1. */
	scale: number
}

export type CursorTextures = Record<CursorName, CursorTexture>

interface CursorDef {
	name: CursorName
	file: string
	hotspotX: number
	hotspotY: number
}

const CURSOR_SIZE = 24

const CURSOR_DEFS: readonly CursorDef[] = [
	{
		name: 'default',
		file: 'tile_0026-15x.png',
		hotspotX: 0,
		hotspotY: 0
	},
	{
		name: 'pointer',
		file: 'tile_0134-15x.png',
		hotspotX: 9,
		hotspotY: 2
	},
	{
		name: 'grab',
		file: 'tile_0135-15x.png',
		hotspotX: 12,
		hotspotY: 12
	},
	{
		name: 'grabbing',
		file: 'tile_0136-15x.png',
		hotspotX: 12,
		hotspotY: 12
	}
]

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image()
		// Cursor art is trimmed and re-opacified through `getImageData`, which
		// throws on a tainted canvas: without CORS a CDN-hosted cursor would fall
		// back to the painted placeholder instead of the real sprite.
		image.crossOrigin = 'anonymous'
		image.onload = () => resolve(image)
		image.onerror = () => reject(new Error(`cursor image failed: ${url}`))
		image.src = url
	})
}

function imageBounds(image: HTMLImageElement): {
	x: number
	y: number
	width: number
	height: number
} {
	const canvas = document.createElement('canvas')
	canvas.width = image.width
	canvas.height = image.height
	// Runs getImageData immediately after drawImage: keep the canvas CPU-backed so
	// the readback does not force a GPU sync.
	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) return { x: 0, y: 0, width: image.width, height: image.height }
	ctx.drawImage(image, 0, 0)
	const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
	let minX = canvas.width
	let minY = canvas.height
	let maxX = 0
	let maxY = 0
	for (let y = 0; y < canvas.height; y += 1) {
		for (let x = 0; x < canvas.width; x += 1) {
			if (data[(y * canvas.width + x) * 4 + 3] === 0) continue
			if (x < minX) minX = x
			if (y < minY) minY = y
			if (x > maxX) maxX = x
			if (y > maxY) maxY = y
		}
	}
	if (minX > maxX || minY > maxY) {
		return { x: 0, y: 0, width: image.width, height: image.height }
	}
	return {
		x: minX,
		y: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1
	}
}

function fallbackTexture(): CursorTexture {
	const canvas = document.createElement('canvas')
	canvas.width = CURSOR_SIZE
	canvas.height = CURSOR_SIZE
	const ctx = canvas.getContext('2d')
	if (ctx) {
		ctx.fillStyle = '#eef2ff'
		ctx.fillRect(9, 4, 6, 16)
		ctx.fillRect(4, 10, 16, 6)
	}
	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'nearest'
	return { texture, anchorX: 0.5, anchorY: 0.5, scale: 1 }
}

/**
 * The aiming crosshair. The sprite ships as a 74×74 pack canvas with a tiny
 * 8×8 dot in the middle, so it is loaded at its native size instead of being
 * fitted to the 24 px system box below.
 */
const CROSSHAIR_DEF: CursorDef = {
	name: 'crosshair',
	file: 'crosshair-000.png',
	hotspotX: 37,
	hotspotY: 37
}

/** The crosshair is drawn half again as large as the pixels it ships with. */
const CROSSHAIR_SCALE = 1.5

/**
 * Loads a cursor at the native size of its painted pixels.
 *
 * Fitting the 74×74 crosshair canvas into the 24 px system box scaled its dot
 * up until it filled the box as a black square with a white core, so the
 * painted pixels are copied 1:1 into their own texture here. Nothing is
 * resampled — canvas smoothing is off and the texture samples nearest — so the
 * dot keeps hard pixels when the game draws it larger instead of turning into
 * a blurred smudge.
 */
async function nativeCursor(def: CursorDef, base: string): Promise<CursorTexture> {
	const image = await loadImage(`${base}/cursors/${def.file}`)
	const bounds = imageBounds(image)

	const canvas = document.createElement('canvas')
	canvas.width = bounds.width
	canvas.height = bounds.height
	const ctx = canvas.getContext('2d')
	if (!ctx) return fallbackTexture()
	ctx.imageSmoothingEnabled = false
	ctx.drawImage(
		image,
		bounds.x,
		bounds.y,
		bounds.width,
		bounds.height,
		0,
		0,
		bounds.width,
		bounds.height
	)

	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'nearest'
	return {
		texture,
		anchorX: (def.hotspotX - bounds.x) / bounds.width,
		anchorY: (def.hotspotY - bounds.y) / bounds.height,
		scale: CROSSHAIR_SCALE
	}
}

async function normaliseCursor(def: CursorDef, base: string): Promise<CursorTexture> {
	const image = await loadImage(`${base}/cursors/${def.file}`)
	const bounds = imageBounds(image)
	const scale = CURSOR_SIZE / Math.max(bounds.width, bounds.height)
	const width = bounds.width * scale
	const height = bounds.height * scale
	const x = (CURSOR_SIZE - width) / 2
	const y = (CURSOR_SIZE - height) / 2

	const canvas = document.createElement('canvas')
	canvas.width = CURSOR_SIZE
	canvas.height = CURSOR_SIZE
	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) return fallbackTexture()
	ctx.imageSmoothingEnabled = false
	ctx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, x, y, width, height)

	// Cursor assets are anti-aliased at their edges; force every painted pixel
	// to full opacity so the crosshair never looks translucent.
	const pixels = ctx.getImageData(0, 0, CURSOR_SIZE, CURSOR_SIZE)
	for (let i = 3; i < pixels.data.length; i += 4) {
		pixels.data[i] = pixels.data[i] > 0 ? 255 : 0
	}
	ctx.putImageData(pixels, 0, 0)

	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'nearest'
	return {
		texture,
		anchorX: (x + (def.hotspotX - bounds.x) * scale) / CURSOR_SIZE,
		anchorY: (y + (def.hotspotY - bounds.y) * scale) / CURSOR_SIZE,
		scale: 1
	}
}

/** All system cursor art is normalised to one 24×24 box with a nearest fit. */
export async function loadCursorTextures(base: string): Promise<CursorTextures> {
	const textures = new Map<CursorName, CursorTexture>()
	await Promise.all(
		CURSOR_DEFS.map(async (def) => {
			try {
				textures.set(def.name, await normaliseCursor(def, base))
			} catch {
				textures.set(def.name, fallbackTexture())
			}
		})
	)
	return {
		default: textures.get('default') ?? fallbackTexture(),
		pointer: textures.get('pointer') ?? fallbackTexture(),
		grab: textures.get('grab') ?? fallbackTexture(),
		grabbing: textures.get('grabbing') ?? fallbackTexture(),
		crosshair: await loadCrosshair(base)
	}
}

async function loadCrosshair(base: string): Promise<CursorTexture> {
	try {
		return await nativeCursor(CROSSHAIR_DEF, base)
	} catch {
		return fallbackTexture()
	}
}

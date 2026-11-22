import { Texture } from 'pixi.js'

/**
 * The shell that carries every pearl.
 *
 * Pearls themselves are hand-drawn sprites in `art/pearls-sheet.png` (16 px
 * cells, four by three); the shell has no cell on that sheet and is painted
 * here in the same 16 px language as the fish, inspired by the ribbed beige
 * scallop the pearl references used.
 */
const SHELL_SPRITE = [
	'................',
	'................',
	'......1111......',
	'....11222211....',
	'...1233333321...',
	'..123344443321..',
	'..123455443321..',
	'.12334455443321.',
	'.12344555443321.',
	'.12334455443321.',
	'..123344443321..',
	'..112233332211..',
	'...1122332211...',
	'....11111111....',
	'......1111......',
	'................'
]

const SHELL_PALETTE: readonly [number, number, number, number, number] = [
	0x2b241c, 0x8a6f4a, 0xd9c39a, 0xf1e3c2, 0xfff6df
]

let cached: Texture | null = null

function paintSprite(map: readonly string[], palette: readonly number[]): Texture {
	const canvas = document.createElement('canvas')
	canvas.width = 16
	canvas.height = 16
	const ctx = canvas.getContext('2d')
	if (ctx) {
		for (let y = 0; y < 16; y += 1) {
			const row = map[y] ?? ''
			for (let x = 0; x < 16; x += 1) {
				const key = row[x]
				if (!key || key === '.') continue
				const color = palette[Number(key) - 1]
				if (color === undefined) continue
				ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
				ctx.fillRect(x, y, 1, 1)
			}
		}
	}
	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'nearest'
	return texture
}

/** The shell texture used in the fight, in flight and before the reveal. */
export function shellTexture(): Texture {
	if (cached) return cached
	cached = paintSprite(SHELL_SPRITE, SHELL_PALETTE)
	return cached
}

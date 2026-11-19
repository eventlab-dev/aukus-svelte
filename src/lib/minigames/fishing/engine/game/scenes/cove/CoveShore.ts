import { Graphics } from 'pixi.js'
import { C, VIEW } from '../../../config'
import { drawDepthRamp } from '../dither'
import { CoveWater } from './CoveWater'
import { DOCK, SHORE_X } from './geometry'

export class CoveShore extends CoveWater {
	drawWorld(g: Graphics): void {
		const shore = SHORE_X

		g.rect(0, 0, VIEW.width, VIEW.height).fill(this.palette.waterFar)

		// Depth bands from the bank to the open sea. The ramp starts a little left
		// of the nominal shore so the wavy bank never shows a gap, runs to the
		// right edge of the frame (the bay has no far bank) and is dithered, so the
		// dark side does not band into vertical stripes.
		drawDepthRamp(g, {
			axis: 'x',
			from: shore - 10,
			to: VIEW.width,
			stops: this.palette.waterStops
		})

		// The open sea reads through its own surface now: the depth ramp carries
		// the shallow-to-deep run of colour, and the living water (caustics, glints
		// and foam) is drawn by `pixelWater` above this layer. The painted field of
		// wavelets, crests, sparkles and the fixed foam line that used to stand in
		// for it are gone — they were static strokes over a moving surface.

		// Slush and drift ice near the left bank.
		this.drawIce(g, this.shoreEdgeAt(24) + 6, 24, 15, 3)
		this.drawIce(g, this.shoreEdgeAt(92) + 9, 92, 9, 2)
		this.drawIce(g, this.shoreEdgeAt(158) + 5, 158, 12, 2.5)
		this.drawIce(g, this.shoreEdgeAt(222) + 10, 222, 17, 3)
		this.drawIce(g, this.shoreEdgeAt(262) + 6, 262, 10, 2)

		// A few loose floes drifting in the open water.
		this.drawIce(g, 268, 46, 10, 2.2)
		this.drawIce(g, 352, 196, 13, 2.6)
		this.drawIce(g, 424, 84, 8, 1.8)
		for (let i = 0; i < 26; i += 1) {
			const y = 16 + ((i * 41) % (VIEW.height - 28))
			const x = this.shoreEdgeAt(y) + 2 + ((i * 17) % 18)
			g.rect(x, y, 1, 1).fill({
				color: i % 3 === 0 ? this.palette.snow : this.palette.ice,
				alpha: 0.35
			})
		}

		this.drawShore(g)
		// The pier is scenery, not background: drawing it into the world layer put
		// it *under* the water surface, so ripples, glints and the shoal ran across
		// the planks. It is built in `drawScenery` with the other props instead.
	}
	protected drawShore(g: Graphics): void {
		const height = VIEW.height

		// Snow field follows a soft, irregular bank instead of a straight edge.
		const snowPoly: number[] = [0, 0]
		for (let y = 0; y <= height; y += 2) {
			snowPoly.push(this.shoreEdgeAt(y), y)
		}
		snowPoly.push(0, height)
		g.poly(snowPoly).fill(this.palette.snowShade)

		const innerPoly: number[] = [0, 0]
		for (let y = 0; y <= height; y += 2) {
			innerPoly.push(this.shoreEdgeAt(y) - 6, y)
		}
		innerPoly.push(0, height)
		g.poly(innerPoly).fill(this.palette.snow)

		// The bank used to be strewn with pairs of pale ellipses every 29 px, meant
		// as wind drifts. On snow they read as flat grey ovals lying on the bank —
		// stray shadows rather than relief — so the bank is left clean: its relief
		// comes from the wavy edge, the ice shelf and the props that stand on it,
		// each of which now casts its own contact shadow.

		for (let y = 12; y < height; y += 41) {
			const tuftX = this.shoreEdgeAt(y) - 18 - ((y * 5) % 9)
			g.rect(tuftX, y + 4, 1, 4).fill({ color: 0x7d6a4f, alpha: 0.65 })
			g.rect(tuftX + 3, y + 5, 1, 3).fill({ color: 0x8f7a58, alpha: 0.5 })
		}

		// Icy shelf follows the same wavy water line.
		const traceEdge = (offset: number): void => {
			g.moveTo(this.shoreEdgeAt(0) + offset, 0)
			for (let y = 2; y <= height; y += 2) {
				g.lineTo(this.shoreEdgeAt(y) + offset, y)
			}
		}
		traceEdge(0)
		g.stroke({ width: 9, color: this.palette.ice })
		traceEdge(-2)
		g.stroke({ width: 2, color: this.palette.snowLight, alpha: 0.75 })
		traceEdge(1)
		g.stroke({ width: 2, color: this.palette.iceDeep, alpha: 0.9 })
		traceEdge(0)
		g.stroke({ width: 1, color: 0x1b4a5e, alpha: 0.55 })

		for (let y = 0; y < height; y += 23) {
			const crackY = y + ((y * 3) % 9)
			const edge = this.shoreEdgeAt(crackY)
			g.moveTo(edge - 8, crackY)
				.lineTo(edge - 4, crackY + 4)
				.lineTo(edge - 5, crackY + 8)
				.stroke({ width: 1, color: this.palette.snow, alpha: 0.55 })
		}

		// A handful of sparkles so the snow does not read as flat paper.
		for (let i = 0; i < 30; i += 1) {
			const sx = 4 + ((i * 23) % 40)
			const sy = 6 + ((i * 37) % (height - 12))
			if ((sx + sy) % 4 === 0) {
				g.rect(sx, sy, 1, 1).fill({
					color: this.palette.snowLight,
					alpha: 0.9
				})
			}
		}
	}

	protected drawDock(g: Graphics): void {
		const x = DOCK.x
		const y = DOCK.y
		const width = DOCK.width
		const height = DOCK.bottom - y

		// Horizontal walkway: cold shadow, deck and darker side edges.
		g.rect(x + 5, y + 5, width, height).fill({
			color: 0x0a2030,
			alpha: 0.4
		})
		g.rect(x, y, width, height).fill(C.brown)
		g.rect(x, y, width, 3).fill(C.brownLight)
		g.rect(x, y, 2, height).fill(C.brownDark)
		g.rect(x + width - 2, y, 2, height).fill(C.brownDark)
		g.rect(x + 2, y + height - 2, width - 4, 2).fill({
			color: C.brownDark,
			alpha: 0.75
		})

		// Cross-planks run vertically along the length of the pier.
		for (let px = x + 7; px < x + width - 2; px += 9) {
			g.rect(px, y + 2, 1, height - 4).fill({
				color: C.brownDark,
				alpha: 0.7
			})
			g.rect(px + 2, y + 6 + ((px * 7) % 14), 1, 2).fill({
				color: C.brownDark,
				alpha: 0.4
			})
		}

		// Snow settled on the planks and posts.
		g.rect(x + 2, y + 2, width - 4, 2).fill({
			color: this.palette.snow,
			alpha: 0.6
		})
		for (let px = x + 4; px < x + width - 6; px += 13) {
			const patch = 4 + ((px * 7) % 5)
			g.rect(px, y + 3, patch, 2).fill({
				color: this.palette.snowLight,
				alpha: 0.75
			})
			g.rect(px, y + height - 4, patch - 1, 1).fill({
				color: this.palette.snow,
				alpha: 0.45
			})
		}
		g.ellipse(x + width - 10, y + 5, 9, 3).fill({
			color: this.palette.snowLight,
			alpha: 0.85
		})

		// Support posts on the water and shore sides, with snow caps.
		for (let px = x + 10; px < x + width - 6; px += 30) {
			g.rect(px, y - 3, 9, 4).fill(C.brownDark)
			g.rect(px, y + height - 1, 9, 4).fill(C.brownDark)
			g.rect(px, y - 3, 9, 2).fill(C.brownLight)
			g.rect(px, y + height - 1, 9, 2).fill(C.brownLight)
			g.rect(px, y - 4, 9, 2).fill({
				color: this.palette.snow,
				alpha: 0.9
			})
			g.rect(px, y + height + 2, 9, 1).fill({
				color: this.palette.snowShade,
				alpha: 0.7
			})
		}
	}

	// ---------------------------------------------------------------- scenery
}

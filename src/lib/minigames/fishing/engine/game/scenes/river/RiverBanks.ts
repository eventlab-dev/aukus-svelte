import { Graphics } from 'pixi.js'
import { VIEW } from '../../../config'
import { RiverWater } from './RiverWater'
import { noise } from './geometry'

export class RiverBanks extends RiverWater {
	drawWorld(g: Graphics): void {
		// Cold, dark bank soil under everything; snow and water cover it.
		g.rect(0, 0, VIEW.width, VIEW.height).fill(this.palette.farShore)

		// The water goes in first: it is a full-frame depth ramp, and both banks
		// are painted over it, so the ramp needs no per-row clipping and its bands
		// can be dithered. They used to be one-pixel rows, which banded into
		// visible horizontal stripes down the channel.
		this.drawWater(g)
		this.drawFarBank(g)
		this.drawWaterDetails(g)
		this.drawNearBank(g)
		this.drawBankLips(g)
	}

	private drawFarBank(g: Graphics): void {
		const shade: number[] = [0, 0]
		for (let x = 0; x <= VIEW.width; x += 2) shade.push(x, this.farLine[x] + 4)
		shade.push(VIEW.width, 0)
		g.poly(shade).fill(this.palette.snowShade)

		const snow: number[] = [0, 0]
		for (let x = 0; x <= VIEW.width; x += 2) snow.push(x, this.farLine[x] - 3)
		snow.push(VIEW.width, 0)
		g.poly(snow).fill(this.palette.snow)

		// The upper bank used to be dotted with pairs of pale ellipses, meant as
		// wind drifts. They read as grey ovals lying on the snow — shadows of
		// nothing — so the relief is left to the trees, each of which casts its own
		// contact shadow where its trunk meets the snow.

		// Snow that slid over the edge since the last thaw. It stays clear of the
		// waterline: the drifts used to hang over the ice rim and float on water.
		for (let x = 4; x < VIEW.width; x += 15) {
			const y = this.farLine[x] - 5
			g.ellipse(x, y, 5 + ((x * 3) % 6), 1.3).fill({
				color: this.palette.snowLight,
				alpha: 0.7
			})
			g.ellipse(x + 5, y - 2, 4, 1).fill({
				color: this.palette.snowShade,
				alpha: 0.4
			})
		}

		// The spruces themselves are sprites, added to the sorted prop layer in
		// `drawScenery`: a Graphics cannot hold a texture, and the props layer
		// already sorts by the y of the base exactly like the two ranks used to.
	}
	private drawNearBank(g: Graphics): void {
		const shade: number[] = [0, VIEW.height]
		for (let x = 0; x <= VIEW.width; x += 2) {
			shade.push(x, this.nearLine[x] + 1)
		}
		shade.push(VIEW.width, VIEW.height)
		g.poly(shade).fill(this.palette.snowShade)

		const snow: number[] = [0, VIEW.height]
		for (let x = 0; x <= VIEW.width; x += 2) {
			snow.push(x, this.nearLine[x] + 8)
		}
		snow.push(VIEW.width, VIEW.height)
		g.poly(snow).fill(this.palette.snow)

		// Wind drifts across the bank used to be a field of pale ellipses too; the
		// bank keeps the boot prints, the grounded floes and the props' shadows.

		// A trail of boot prints leading to the angler's spit.
		for (let i = 0; i < 9; i += 1) {
			const t = i / 8
			const side = i % 2 === 0 ? -2.5 : 2.5
			g.ellipse(34 + t * 56 + side, 264 - t * 56, 2.2, 1.2).fill({
				color: 0x8fa8ba,
				alpha: 0.5
			})
		}

		// Ice floes that have grounded on the shallow bank.
		for (const [x, width] of [
			[148, 12],
			[232, 8],
			[322, 10],
			[452, 7]
		] as const) {
			const y = this.nearAt(x) + 10
			g.ellipse(x, y, width, width * 0.24).fill({
				color: this.palette.ice,
				alpha: 0.55
			})
			g.ellipse(x - 1, y - 1, width * 0.6, width * 0.14).fill({
				color: this.palette.snowLight,
				alpha: 0.75
			})
		}

		// Sparkles so the snow does not read as flat paper.
		for (let i = 0; i < 40; i += 1) {
			const x = 4 + ((i * 47) % (VIEW.width - 8))
			const y = this.nearAt(x) + 4 + ((i * 29) % 30)
			if (y > VIEW.height - 2 || (x + y) % 3 !== 0) continue
			this.rect(g, x, y, 1, 1, this.palette.snowLight, 0.9)
		}
	}

	private drawBankLips(g: Graphics): void {
		// Eroded soil under the far snow, then the ice pushed out of the bank.
		this.traceEdge(g, (x) => this.farLine[x] + 2)
		g.stroke({ width: 2, color: 0x1c3238, alpha: 0.5 })
		this.traceEdge(g, (x) => this.farLine[x] - 1)
		g.stroke({ width: 3, color: this.palette.ice, alpha: 0.95 })
		this.traceEdge(g, (x) => this.farLine[x] - 2)
		g.stroke({ width: 1, color: this.palette.snowLight, alpha: 0.8 })
		this.traceEdge(g, (x) => this.farLine[x] + 1)
		g.stroke({ width: 1, color: this.palette.iceDeep, alpha: 0.6 })

		// Icicles hanging off the far ledge.
		for (let x = 12; x < VIEW.width; x += 41) {
			const y = this.farLine[x] + 1
			const length = 2 + Math.round(noise(x, 21) * 4)
			this.rect(g, x, y, 1, length, this.palette.ice, 0.75)
			this.rect(g, x + 1, y, 1, Math.max(1, length - 2), this.palette.snowLight, 0.5)
		}

		// Near shelf: a narrow ice ledge with a wet dark seam.
		this.traceEdge(g, (x) => this.nearLine[x] - 1)
		g.stroke({ width: 1, color: 0x0c2a3c, alpha: 0.45 })
		this.traceEdge(g, (x) => this.nearLine[x] + 1)
		g.stroke({ width: 3, color: this.palette.ice, alpha: 0.85 })
		this.traceEdge(g, (x) => this.nearLine[x] - 1)
		g.stroke({ width: 1, color: this.palette.snowLight, alpha: 0.55 })
		this.traceEdge(g, (x) => this.nearLine[x] + 3)
		g.stroke({ width: 1, color: this.palette.iceDeep, alpha: 0.6 })

		// Cracks and slush in the ledge.
		for (let x = 8; x < VIEW.width; x += 23) {
			const y = this.nearLine[x]
			g.moveTo(x - 4, y + 2)
				.lineTo(x + 2, y + 4)
				.lineTo(x + 5, y + 7)
				.stroke({ width: 1, color: this.palette.snow, alpha: 0.45 })
		}
		for (let x = 20; x < VIEW.width; x += 37) {
			g.ellipse(x, this.nearLine[x], 5 + (x % 4), 1.2).fill({
				color: this.palette.snow,
				alpha: 0.32
			})
		}
	}
}

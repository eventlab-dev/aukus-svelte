import { Container, Graphics } from 'pixi.js'
import { paintContactShadow } from './props'

/**
 * A small procedural clump of dry winter grass. The Tiny Coast `Grass.png` is
 * a solid terrain tile, not a tuft, so using it directly left olive squares on
 * the snow. This helper draws individual blades instead.
 */
export function drawGrassTuft(
	props: Container,
	x: number,
	y: number,
	color: number,
	flip = 1,
	scale = 1
): void {
	const g = new Graphics()
	// The tuft's shadow goes first and is centred on the blades' own foot: drawn
	// a pixel lower it read as a dark puddle the grass hovered over.
	paintContactShadow(g, x, y, 5.5 * scale)
	for (let i = 0; i < 6; i += 1) {
		const bladeX = x + (i - 2.5) * 2.1 * scale * flip
		const height = (4 + ((i * 3 + Math.round(x)) % 6)) * scale
		const lean = (i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0) * scale * flip
		g.moveTo(bladeX, y)
			.lineTo(bladeX + lean, y - height)
			.stroke({
				width: Math.max(1, scale),
				color: i % 3 === 0 ? 0x6a5a42 : color,
				alpha: 0.8
			})
	}
	g.zIndex = y
	props.addChild(g)
}

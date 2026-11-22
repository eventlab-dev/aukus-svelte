import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { currentFontScale, currentFontStack } from '../fonts'
import { alignInkX, anchorInk, realignInk } from './textInk'
import type { WeatherId } from '../types'
import { UI } from './palette'

/**
 * Inset of any full-screen panel from the frame, on all four sides.
 *
 * Each window used to pick its own margins — the water picker 20 px sideways
 * and 37 px top/bottom, the codex 20/8, the help 24/14 — so the same UI read as
 * three differently placed boxes. One inset puts every window in the same spot
 * on the frame.
 */
export const SCREEN_INSET = 12

/** Padding between a panel's frame and its content, on all four sides. */
export const PANEL_PAD = 16

/**
 * Ink contour around every outlined label, in virtual pixels.
 *
 * One width for the whole interface: the wordmark, the boot title, the cast
 * prompt and the floating catch tags used to pick their own — 3, 3, 2.5 and 2 —
 * so the same pixel font read as four different type styles depending on where
 * it stood. Two is the width a pixel outline wants: Canvas strokes the glyph
 * path from its middle, so 2 paints exactly 1 px of ink outside the letter and
 * 1 px inside, and the outside edge of the contour lands on a whole pixel the
 * way every frame in this UI does. A non-integer width (the prompt's 2.5) left a
 * half-pixel fringe, and at 7 px its 1.25 px inside band swallowed the stems it
 * was supposed to protect.
 */
export const TEXT_OUTLINE = 2

export interface TextOptions {
	size?: number
	color?: number
	weight?: number
	align?: 'left' | 'center' | 'right'
	alpha?: number
	letterSpacing?: number
	lineHeight?: number
	/** Wrap long copy at this width (virtual pixels). */
	wordWrapWidth?: number
	/**
	 * Outlines the label with {@link TEXT_OUTLINE} pixels of ink.
	 *
	 * It is an option of `makeText` rather than a `stroke` applied by the caller
	 * so the contour exists before the label is measured: `inkWidth`,
	 * `inkAnchorX` and `inkBox` all read the stroke out of the style, and a
	 * caller that added it afterwards got a label whose box, ink anchor and
	 * baseline were all computed for stroke-less text. That is why an outlined
	 * word sat half a contour off its own anchor and a pixel lower than its
	 * caption line.
	 */
	outline?: boolean
}

export function makeText(value: string, options: TextOptions = {}): Text {
	const style = new TextStyle({
		fontFamily: currentFontStack(),
		fontSize: (options.size ?? 10) * currentFontScale(),
		fontWeight: String(options.weight ?? 500) as TextStyle['fontWeight'],
		fill: options.color ?? UI.text,
		align: options.align ?? 'left',
		letterSpacing: options.letterSpacing ?? 0,
		lineHeight: options.lineHeight,
		wordWrap: options.wordWrapWidth !== undefined,
		wordWrapWidth: options.wordWrapWidth,
		breakWords: true,
		// Trimming is off on purpose. Pixi measures a trimmed label by its ink, so
		// one word with a diacritic — «ё» against «е» — produced a taller texture
		// than its neighbours and every centred label in a row shifted by a pixel
		// or two. Untrimmed, the box is the font's own line box: the same for every
		// string at a given size, «ё» or not, so anchors and rows line up.
		trim: false
	})
	const text = new Text({ text: value, style })
	text.resolution = 4
	text.roundPixels = true
	text.alpha = options.alpha ?? 1
	// Before the anchors: both the horizontal and the vertical one measure the
	// ink box, and the contour is part of that box.
	if (options.outline) {
		text.style.stroke = { color: UI.ink, width: TEXT_OUTLINE }
	}
	// Horizontal anchors line up with the glyphs, not with the advance box; the
	// vertical anchor is left alone, the caller decides how the label sits.
	alignInkX(text, options.align ?? 'left')
	return text
}

export function setText(text: Text, value: string): void {
	if (text.text === value) return
	text.text = value
	// The box changes with the string, so the ink anchor has to follow it.
	realignInk(text)
}

/** Width of a compact keycap for a short label, in virtual pixels. */
export function keycapWidth(label: string, fontSize = 6): number {
	const metrics = measureKeycapText(label, fontSize)
	return Math.max(14, Math.ceil(metrics.inkWidth + 6))
}

interface KeycapMetrics {
	advance: number
	inkLeft: number
	inkWidth: number
}

let keycapMeasureCtx: CanvasRenderingContext2D | null = null

function measureKeycapText(label: string, fontSize: number): KeycapMetrics {
	if (!keycapMeasureCtx) {
		const canvas = document.createElement('canvas')
		canvas.width = 128
		canvas.height = 32
		// Every call to measureKeycapText reads the glyph back with getImageData,
		// so this measurement canvas must stay CPU-backed.
		keycapMeasureCtx = canvas.getContext('2d', { willReadFrequently: true })
	}
	if (!keycapMeasureCtx) {
		const advance = label.length * 3.1
		return { advance, inkLeft: 0, inkWidth: advance }
	}

	const ctx = keycapMeasureCtx
	const originX = 8
	const originY = 24
	ctx.font = `700 ${fontSize * currentFontScale()}px ${currentFontStack()}`
	const advance = ctx.measureText(label).width
	ctx.clearRect(0, 0, 128, 32)
	ctx.fillStyle = '#ffffff'
	ctx.textBaseline = 'alphabetic'
	ctx.fillText(label, originX, originY)

	const data = ctx.getImageData(0, 0, 128, 32).data
	let minX = 128
	let maxX = -1
	for (let y = 0; y < 32; y += 1) {
		for (let x = 0; x < 128; x += 1) {
			if (data[(y * 128 + x) * 4 + 3] === 0) continue
			if (x < minX) minX = x
			if (x > maxX) maxX = x
		}
	}
	if (maxX < minX) {
		return { advance, inkLeft: 0, inkWidth: Math.max(1, advance) }
	}
	return {
		advance,
		inkLeft: minX - originX,
		inkWidth: maxX - minX + 1
	}
}

/**
 * Two-band pixel frame used by every panel and card in the UI: an indigo outer
 * outline and a periwinkle inner hairline. The bands stay 1 px so the interface
 * keeps the hard edge of the pixel art around it; `radius` exists only for the
 * few small chips that already had slightly clipped corners.
 */
export function drawPanelFrame(
	g: Graphics,
	x: number,
	y: number,
	w: number,
	h: number,
	radius = 0
): void {
	const r = Math.min(radius, Math.floor(Math.min(w, h) / 2))
	if (r > 0) {
		g.roundRect(x, y, w, h, r).stroke({
			width: 1,
			color: UI.ink,
			alignment: 0
		})
		g.roundRect(x + 1, y + 1, w - 2, h - 2, Math.max(1, r - 1)).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.55
		})
	} else {
		g.rect(x, y, w, h).stroke({ width: 1, color: UI.ink, alignment: 0 })
		g.rect(x + 1, y + 1, w - 2, h - 2).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.55
		})
	}
}

/**
 * Small bordered keycap used by control guides.
 *
 * `flat` drops the raised wood frame and keeps a single hairline edge, for
 * chips that sit inside another panel and should not read as a second button.
 */
export function makeKeycap(label: string, height = 11, fontSize = 6, flat = false): Container {
	const metrics = measureKeycapText(label, fontSize)
	const width = Math.max(14, Math.ceil(metrics.inkWidth + 6))
	const container = new Container()
	const g = new Graphics()
	if (flat) {
		// Opaque on purpose: the chip sits over open water, and a translucent panel
		// let the ripples read through the letters.
		g.roundRect(0, 0, width, height, 2).fill({ color: UI.panelAlt, alpha: 1 })
		g.roundRect(0.5, 0.5, width - 1, height - 1, 2).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.8
		})
	} else {
		g.roundRect(0, 0, width, height, 2).fill(UI.panelAlt)
		drawPanelFrame(g, 0, 0, width, height, 2)
		g.rect(1, 1, width - 2, 1).fill({
			color: UI.periwinklePale,
			alpha: 0.5
		})
		g.rect(1, height - 1, width - 2, 1).fill({ color: UI.ink, alpha: 0.4 })
	}
	container.addChild(g)

	const text = makeText(label, {
		size: fontSize,
		color: UI.text,
		weight: 700,
		align: 'center',
		lineHeight: height
	})
	anchorInk(text, 'center')
	text.position.set(width / 2, height / 2)
	container.addChild(text)
	return container
}

export interface PanelOptions {
	fill?: number
	alpha?: number
	border?: number
	highlight?: number
	shadow?: boolean
	inner?: boolean
}

/** Pixel panel: flat fill, indigo outline, periwinkle hairline and a 1 px bevel. */
export function drawPanel(
	g: Graphics,
	x: number,
	y: number,
	width: number,
	height: number,
	options: PanelOptions = {}
): void {
	const fill = options.fill ?? UI.panel
	const alpha = options.alpha ?? 0.95

	if (options.shadow) {
		g.rect(x + 3, y + 3, width, height).fill({ color: UI.ink, alpha: 0.3 })
	}
	g.rect(x, y, width, height).fill({ color: fill, alpha })
	drawPanelFrame(g, x, y, width, height)
	if (options.inner !== false) {
		g.rect(x + 2, y + 2, width - 4, 1).fill({
			color: UI.periwinklePale,
			alpha: 0.45
		})
		g.rect(x + 2, y + 2, 1, height - 4).fill({
			color: UI.periwinklePale,
			alpha: 0.2
		})
		g.rect(x + 2, y + height - 3, width - 4, 1).fill({
			color: UI.ink,
			alpha: 0.55
		})
		g.rect(x + width - 3, y + 2, 1, height - 4).fill({
			color: UI.ink,
			alpha: 0.25
		})
	}
}

/**
 * Pause bars: two plates with an ice core, the same 12×12 body as the codex
 * mark beside them in the HUD corner.
 *
 * The contour is 2 px, the one the close and fullscreen tiles use: those two
 * arrive as Kenney tiles whose glyph sits on a 2 px ink plate, and the drawn
 * marks beside them kept a 1 px frame, so the HUD's four controls read as two
 * different icon sets. A 2 px plate needs a wider bar to keep any ice inside —
 * at 3 px the bar was all frame — so each bar is 6×12 with a 2×8 core, which is
 * the same proportion of light to ink as the tiles' own glyphs.
 */
export function drawPauseIcon(g: Graphics, ink: number = UI.ink): void {
	g.clear()
	// Two 6 px bars, 2 px of ink on every side of the core, 2 px between them and
	// one column of air at each edge of the 16 px box.
	for (const x of [1, 9] as const) {
		g.rect(x, 2, 6, 12).fill(ink)
		g.rect(x + 2, 4, 2, 8).fill(UI.primary)
	}
}

export function drawPlayIcon(g: Graphics, color: number = UI.text): void {
	g.clear()
	g.moveTo(5, 3).lineTo(12, 8).lineTo(5, 13).closePath().fill(color)
}

/**
 * Tap mark: a fingertip coming down on a surface, in the same 16 px box as the
 * mouse pictogram it replaces on a touch screen.
 *
 * It is drawn rather than shipped as a sprite so the prompt on a phone does not
 * need a second image behind the boot loader: the gesture is three rectangles
 * and a lit crown, in the interface's own ink-periwinkle-ice language.
 */
export function drawTapIcon(g: Graphics): void {
	g.clear()
	// The surface being pressed: a broken line, so the mark reads as a contact
	// and not as an underline for the finger.
	g.rect(1, 12, 5, 1).fill({ color: UI.periwinkle, alpha: 0.9 })
	g.rect(10, 12, 5, 1).fill({ color: UI.periwinkle, alpha: 0.9 })
	// The finger: a wide pad on a short shaft coming down onto that line, ice
	// paper with an ink shade down one side, like every other mark on the frame.
	// The pad has to be this wide — a 3 px stalk read as an exclamation mark.
	g.roundRect(4, 1, 8, 6, 2).fill(UI.text)
	g.rect(5, 6, 6, 6).fill(UI.text)
	g.rect(5, 6, 1, 6).fill({ color: UI.ink, alpha: 0.22 })
	g.rect(4, 1, 8, 1).fill(UI.primary)
}

/** Small pixel fish silhouette used as a decorative bullet. */
export function drawFishGlyph(g: Graphics, color: number): void {
	g.clear()
	g.rect(4, 3, 7, 6).fill(color)
	g.rect(2, 3, 2, 2).fill(color)
	g.rect(2, 7, 2, 2).fill(color)
	g.rect(1, 5, 1, 2).fill(color)
	g.rect(11, 4, 2, 4).fill({ color, alpha: 0.8 })
	g.rect(8, 4, 1, 1).fill(UI.ink)
}

/**
 * One colour per front. Used three ways — the medallion ring, the glyph itself
 * and the wash behind the column — so a badge can never disagree with the sky
 * it names.
 */
export const WEATHER_TINT: Record<WeatherId, number> = {
	clear: UI.amber,
	// Overcast is a grey lid, so its wash is the only neutral one on the rail.
	overcast: UI.textMuted,
	snow: UI.ice,
	blizzard: UI.ice,
	fog: UI.periwinkle,
	// The aurora owns mint: it is the one sky whose light is green.
	aurora: UI.mint
}

/**
 * 12×12 pixel weather glyph. Drawn from the same 1-px grid as the rest of the
 * UI so it stays legible when the canvas is scaled up.
 *
 * `tint` is the front's own colour and is used for every body shape, so the
 * glyph reads as one object with the medallion that rings it instead of a grey
 * cloud sitting inside a coloured badge. Only the specular pixels stay neutral.
 *
 * `compact` shrinks the sun by one pixel on every edge. The rail's cards carry
 * two lines of captions beside the glyph, and the full-size sun was the only
 * icon that filled its card from top to bottom; the cloud glyphs already sit
 * inside a 12 px box with air around them.
 */
export function drawWeatherIcon(
	g: Graphics,
	weather: WeatherId,
	tint: number = WEATHER_TINT[weather],
	compact = false
): void {
	g.clear()
	const cloud = (top: number): void => {
		g.rect(3, top + 3, 7, 3).fill(tint)
		g.rect(4, top + 1, 4, 3).fill(tint)
		g.rect(2, top + 5, 9, 2).fill(tint)
		g.rect(4, top + 2, 3, 1).fill({ color: UI.text, alpha: 0.4 })
	}

	switch (weather) {
		case 'clear':
			if (compact) {
				g.rect(5, 1, 2, 2).fill(tint)
				g.rect(5, 9, 2, 2).fill(tint)
				g.rect(1, 5, 2, 2).fill(tint)
				g.rect(9, 5, 2, 2).fill(tint)
				g.rect(2, 2, 1, 1).fill({ color: tint, alpha: 0.7 })
				g.rect(9, 2, 1, 1).fill({ color: tint, alpha: 0.7 })
				g.rect(2, 9, 1, 1).fill({ color: tint, alpha: 0.7 })
				g.rect(9, 9, 1, 1).fill({ color: tint, alpha: 0.7 })
				// Disc: a 4×4 body with one pixel of crown and shoulder, so it still
				// reads round at this size instead of as a square.
				g.rect(4, 4, 4, 4).fill(tint)
				g.rect(5, 3, 2, 1).fill(tint)
				g.rect(3, 5, 1, 2).fill(tint)
				g.rect(5, 5, 2, 2).fill(UI.legendary)
				break
			}
			g.rect(5, 0, 2, 2).fill(tint)
			g.rect(5, 10, 2, 2).fill(tint)
			g.rect(0, 5, 2, 2).fill(tint)
			g.rect(10, 5, 2, 2).fill(tint)
			g.rect(2, 2, 1, 1).fill({ color: tint, alpha: 0.7 })
			g.rect(9, 2, 1, 1).fill({ color: tint, alpha: 0.7 })
			g.rect(2, 9, 1, 1).fill({ color: tint, alpha: 0.7 })
			g.rect(9, 9, 1, 1).fill({ color: tint, alpha: 0.7 })
			g.rect(4, 3, 4, 6).fill(tint)
			g.rect(3, 4, 6, 4).fill(tint)
			g.rect(5, 4, 2, 2).fill(UI.legendary)
			break
		case 'overcast':
			cloud(2)
			break
		case 'snow':
			// Snow falls as flakes, never as drops: three little crosses under the
			// cloud, so the icon cannot be misread as rain over a frozen lake.
			cloud(0)
			for (const [x, y] of [
				[3, 9],
				[6, 10],
				[9, 9]
			] as const) {
				g.rect(x - 1, y, 3, 1).fill(tint)
				g.rect(x, y - 1, 1, 3).fill(tint)
			}
			break
		case 'blizzard':
			// A blown flake: the cloud plus horizontal snow streaks, no lightning.
			cloud(0)
			g.rect(2, 9, 4, 1).fill(tint)
			g.rect(7, 10, 3, 1).fill({ color: tint, alpha: 0.8 })
			g.rect(3, 11, 3, 1).fill({ color: tint, alpha: 0.6 })
			g.rect(8, 8, 1, 1).fill(UI.text)
			g.rect(1, 10, 1, 1).fill(UI.text)
			break
		case 'fog':
			cloud(0)
			g.rect(1, 9, 6, 1).fill({ color: tint, alpha: 0.85 })
			g.rect(6, 11, 5, 1).fill({ color: tint, alpha: 0.6 })
			break
		case 'aurora':
			// The only glyph that stands up: three hanging curtains that thin
			// towards the bottom, over a row of stars. It carries no cloud, so the
			// rail card cannot confuse it with fog at a glance.
			g.rect(2, 1, 1, 4).fill(tint)
			g.rect(3, 2, 1, 6).fill({ color: tint, alpha: 0.9 })
			g.rect(4, 4, 1, 5).fill({ color: tint, alpha: 0.65 })
			g.rect(6, 0, 1, 5).fill(tint)
			g.rect(7, 2, 1, 6).fill({ color: tint, alpha: 0.85 })
			g.rect(8, 4, 1, 4).fill({ color: tint, alpha: 0.55 })
			g.rect(10, 1, 1, 4).fill({ color: tint, alpha: 0.8 })
			g.rect(10, 6, 1, 3).fill({ color: tint, alpha: 0.45 })
			g.rect(1, 9, 1, 1).fill(UI.text)
			g.rect(4, 10, 1, 1).fill({ color: UI.text, alpha: 0.8 })
			g.rect(7, 9, 1, 1).fill({ color: UI.text, alpha: 0.7 })
			g.rect(9, 10, 1, 1).fill({ color: UI.text, alpha: 0.6 })
			break
	}
}

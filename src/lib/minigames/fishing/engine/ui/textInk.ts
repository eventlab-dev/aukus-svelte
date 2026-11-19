import type { Text, TextStyle } from 'pixi.js'

/**
 * Glyph-accurate anchors for the pixel font.
 *
 * The UI texts are drawn untrimmed, so every label of a size shares one box —
 * that is what stops «ё»/«й» from changing a label's height. The price is that
 * the box is the font line box (vertically) and the advance run (horizontally),
 * while the glyphs sit somewhere inside it. These helpers measure the ink and
 * turn it into anchor fractions, so a label that is centred, or pinned to an
 * edge, sits where the eye expects the *letters* to be.
 */

/**
 * The same probe Pixi uses to derive a font's ascent/descent. It is measured
 * with `actualBoundingBox*`, i.e. from the drawn ink, which is why the text box
 * does not match the capitals sitting inside it.
 */
const METRICS_PROBE = '|ÉqÅM'
/** One capital: the ink the labels are actually centred on. */
const CAP_PROBE = 'П'

interface InkMetrics {
	ascent: number
	descent: number
	cap: number
}

let inkMeasureCtx: CanvasRenderingContext2D | null = null
const inkMetricsCache = new Map<string, InkMetrics>()

function inkMetrics(style: TextStyle): InkMetrics {
	const family = Array.isArray(style.fontFamily)
		? style.fontFamily.join(',')
		: String(style.fontFamily)
	const size = style.fontSize
	const weight = String(style.fontWeight ?? 500)
	const key = `${family}|${weight}|${size}`
	const cached = inkMetricsCache.get(key)
	if (cached) return cached

	if (!inkMeasureCtx) {
		const canvas = document.createElement('canvas')
		canvas.width = 64
		canvas.height = 32
		inkMeasureCtx = canvas.getContext('2d')
	}
	if (!inkMeasureCtx) {
		const fallback = { ascent: size, descent: 0, cap: size }
		inkMetricsCache.set(key, fallback)
		return fallback
	}
	inkMeasureCtx.font = `${weight} ${size}px ${family}`
	const probe = inkMeasureCtx.measureText(METRICS_PROBE)
	const cap = inkMeasureCtx.measureText(CAP_PROBE)
	const metrics: InkMetrics = {
		ascent: probe.actualBoundingBoxAscent ?? size,
		descent: probe.actualBoundingBoxDescent ?? 0,
		cap: cap.actualBoundingBoxAscent ?? size
	}
	inkMetricsCache.set(key, metrics)
	return metrics
}

/** Stroke width in pixels; `stroke` can also be a colour list or absent. */
function strokeWidthOf(style: TextStyle): number {
	const stroke: unknown = style.stroke
	if (typeof stroke !== 'object' || stroke === null) return 0
	const width = (stroke as { width?: unknown }).width
	return typeof width === 'number' ? width : 0
}

/**
 * Geometry of one single-line label: the box height and the distances from the
 * box top to the baseline and to the top of the capitals.
 *
 * Mirrors `CanvasTextGenerator`: the line is centred in `lineHeight` by
 * `(lineHeight - fontHeight) / 2`, a stroke widens the box and pushes the
 * baseline down by half its width, and an explicit `lineHeight` replaces the
 * font height when it is larger.
 */
function inkBox(style: TextStyle): {
	height: number
	baseline: number
	capTop: number
	cap: number
} {
	const metrics = inkMetrics(style)
	const font = metrics.ascent + metrics.descent
	const strokeWidth = strokeWidthOf(style)
	const lineHeight = style.lineHeight || font
	const shift = lineHeight > font ? (lineHeight - font) / 2 : 0
	const baseline = strokeWidth / 2 + shift + metrics.ascent
	return {
		height: Math.max(lineHeight, font + strokeWidth),
		baseline,
		capTop: baseline - metrics.cap,
		cap: metrics.cap
	}
}

/**
 * Anchor fraction that puts the capitals' optical centre — not the font line
 * box — on the text's position.
 *
 * Turning trimming off gave every label a constant height, but the box is now
 * the font's line box: its middle sits above the capitals, so a `0.5` anchor
 * drops the words a pixel or two low (1 px at 5.5–7, 1.5 px at 11, 3 px at 18).
 * Labels that are centred by hand use this instead of `0.5`, and the ink lands
 * where the eye expects it without giving up the constant box.
 */
export function inkAnchorY(text: Text): number {
	const { height, capTop, cap } = inkBox(text.style)
	if (height <= 0) return 0.5
	return (capTop + cap / 2) / height
}

/**
 * The same for a label whose ink should sit on the anchor line from below —
 * captions pinned above the float, bar labels and the like.
 */
export function inkAnchorBottomY(text: Text): number {
	const { height, baseline } = inkBox(text.style)
	if (height <= 0) return 1
	return baseline / height
}

/** The same for a label whose ink should start at the anchor line from above. */
export function inkAnchorTopY(text: Text): number {
	const { height, capTop } = inkBox(text.style)
	if (height <= 0) return 0
	return Math.max(0, capTop) / height
}

/**
 * Distance from the top of a text box to the top of its capitals, in virtual
 * pixels. {@link inkAnchorTopY} can only aim the *first* line of a wrapped
 * label: a label whose anchor is not 0 shifts its whole box, so copy that wraps
 * to a different number of lines needs this offset added to its position
 * instead.
 */
export function inkTopInset(text: Text): number {
	return Math.max(0, inkBox(text.style).capTop)
}

/**
 * Vertical centre of the capitals of a label's *first* line, measured from the
 * top of its box.
 *
 * A bullet pinned beside wrapped copy has one job: sit on the line of letters it
 * introduces. The box top is the line box of the font, and the letters start a
 * little below it, so a marker placed at the box top (or at its middle) hangs
 * above the words. Returned in box units, so a caller can add it to the label's
 * own y and stay inside the wrapped row it measured.
 */
export function inkCapCenterY(text: Text): number {
	const { capTop, cap } = inkBox(text.style)
	return capTop + cap / 2
}

export type InkAlign = 'left' | 'center' | 'right'

/** How a label is anchored horizontally, so a text change can re-aim it. */
const inkAligns = new WeakMap<Text, InkAlign>()

interface InkSpan {
	/** Ink start, in virtual pixels, relative to the pen position. */
	left: number
	/** Ink width, in virtual pixels. */
	width: number
}

const INK_SCAN_SCALE = 4
const inkSpanCache = new Map<string, InkSpan>()
let inkScanCanvas: HTMLCanvasElement | null = null
let inkScanCtx: CanvasRenderingContext2D | null = null

/**
 * Where the glyphs actually sit inside a label, measured by drawing the string
 * and scanning its alpha.
 *
 * With trimming off the box is the *advance* width, and this pixel font puts a
 * good deal of empty advance after every glyph: an eleven-letter caption has
 * ~16 px of blank space at its right end. Canvas `actualBoundingBox*` reports
 * odd bearings for this font (a constant 2 px at every size), so the ink is
 * measured from the rendered pixels instead — the same way `measureKeycapText`
 * measures a chip.
 */
function inkSpan(text: Text): InkSpan {
	const style = text.style
	const value = text.text
	const family = Array.isArray(style.fontFamily)
		? style.fontFamily.join(',')
		: String(style.fontFamily)
	const size = style.fontSize
	const weight = String(style.fontWeight ?? 500)
	const key = `${value}|${family}|${weight}|${size}`
	const cached = inkSpanCache.get(key)
	if (cached) return cached

	const fallback: InkSpan = { left: 0, width: Math.max(1, text.width) }
	if (!inkScanCtx) {
		inkScanCanvas = document.createElement('canvas')
		inkScanCtx = inkScanCanvas.getContext('2d', { willReadFrequently: true })
	}
	const ctx = inkScanCtx
	const canvas = inkScanCanvas
	if (!ctx || !canvas) return fallback

	const px = size * INK_SCAN_SCALE
	ctx.font = `${weight} ${px}px ${family}`
	const metrics = ctx.measureText(value)
	const ascent = metrics.fontBoundingBoxAscent ?? px
	const descent = metrics.fontBoundingBoxDescent ?? px * 0.3
	const width = Math.ceil(metrics.width) + 32
	const height = Math.ceil(ascent + descent) + 32
	if (canvas.width < width) canvas.width = width
	if (canvas.height < height) canvas.height = height

	const originX = 16
	const originY = 16 + Math.ceil(ascent)
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.font = `${weight} ${px}px ${family}`
	ctx.fillStyle = '#ffffff'
	ctx.textBaseline = 'alphabetic'
	ctx.fillText(value, originX, originY)

	const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
	let minX = canvas.width
	let maxX = -1
	for (let y = 0; y < canvas.height; y += 1) {
		for (let x = 0; x < canvas.width; x += 1) {
			if (data[(y * canvas.width + x) * 4 + 3] === 0) continue
			if (x < minX) minX = x
			if (x > maxX) maxX = x
		}
	}
	if (maxX < minX) return fallback

	const letterSpacing = style.letterSpacing ?? 0
	const span: InkSpan = {
		left: (minX - originX) / INK_SCAN_SCALE,
		// Pixi letterspaces every glyph after the first; the scan draws the run in
		// one go, so the gap per glyph is added back by hand.
		width: (maxX - minX + 1) / INK_SCAN_SCALE + letterSpacing * Math.max(0, value.length - 1)
	}
	inkSpanCache.set(key, span)
	return span
}

/**
 * Anchor fraction that puts the *glyphs* — not the advance box — on the text's
 * position, for the given horizontal alignment.
 *
 * This is the horizontal twin of {@link inkAnchorY}: the constant box starts at
 * the pen position and ends at the advance, while the ink is narrower and sits
 * a fraction of a pixel left, so `0.5` leaves a visible blank at the right end
 * of short labels and right-aligned labels drift left.
 */
export function inkAnchorX(text: Text, align: InkAlign): number {
	const classic = align === 'center' ? 0.5 : align === 'right' ? 1 : 0
	const boxWidth = text.width
	// Multi-line and wrapped copy is laid out line by line; the ink of one line
	// says nothing about the box, so those keep the plain anchors.
	if (boxWidth <= 0 || text.text.includes('\n') || text.style.wordWrap) {
		return classic
	}
	const style = text.style
	const half = strokeWidthOf(style) / 2
	const span = inkSpan(text)
	const left = half + span.left
	const right = left + span.width
	const anchor = align === 'center' ? (left + right) / 2 : align === 'right' ? right : left
	return anchor / boxWidth
}

/**
 * Width of the glyphs of a single-line label, in virtual pixels.
 *
 * The box is the advance run, and this font leaves a good deal of empty advance
 * after the last glyph (about 5 px on a nine-letter caption at size 7). Laying
 * something out against `text.width` — the keycap next to a prompt, the centring
 * of a prompt block — therefore leaves a phantom gap that grows with the copy.
 * This is the measurement to use when the next object has to touch the letters.
 */
export function inkWidth(text: Text): number {
	if (text.width <= 0 || text.text.includes('\n') || text.style.wordWrap) {
		return text.width
	}
	return strokeWidthOf(text.style) + inkSpan(text).width
}

/**
 * Anchors a label by its glyphs on both axes and remembers the horizontal
 * alignment, so {@link realignInk} can re-aim a label whose text is rewritten
 * later (a clock caption, a percentage, a sound toggle).
 */
export function anchorInk(
	text: Text,
	align: InkAlign,
	vertical: 'center' | 'top' | 'bottom' = 'center'
): void {
	alignInkX(text, align)
	text.anchor.y =
		vertical === 'bottom'
			? inkAnchorBottomY(text)
			: vertical === 'top'
				? inkAnchorTopY(text)
				: inkAnchorY(text)
}

/** Sets only the horizontal anchor, and remembers the alignment it came from. */
export function alignInkX(text: Text, align: InkAlign): void {
	inkAligns.set(text, align)
	text.anchor.x = inkAnchorX(text, align)
}

/** Re-aims a label after its text was rewritten in place. */
export function realignInk(text: Text): void {
	const align = inkAligns.get(text)
	if (align) text.anchor.x = inkAnchorX(text, align)
}

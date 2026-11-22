import { CanvasTextMetrics, Container, type Text } from 'pixi.js'
import { UI } from './palette'
import { makeText } from './theme'

/**
 * Inline markup of the manual's copy.
 *
 * The lessons are three short rules each, and the player reads them once, in a
 * fight, so the two things a rule turns on have to stand out on their own: the
 * control it names and the word that carries the rule. Both are written into
 * the string instead of being laid out by hand, because a line that wraps must
 * keep its colours across the break — a colour applied to a whole `Text` cannot
 * do that, and a hand-placed row of labels breaks the moment the copy grows a
 * word on a phone.
 *
 * - `[ЛКМ]` — a key or a control, painted in ice: the same tone the interface
 *   uses for information and for the grips' liquid. The brackets stay on screen:
 *   the copy has always written its keys that way, and a bare «ЛКМ» reads as a
 *   Russian word instead of as a button.
 * - `{рывок}` — the word the rule is about, painted in amber: the tone the
 *   landing cue already uses for "look here".
 *
 * Braces never reach the screen; they only mark the run.
 */
const KEY_TONE = UI.ice
const RULE_TONE = UI.amber

/** One run of copy in a single colour. */
export interface CopyRun {
	readonly text: string
	readonly color: number
}

const MARKUP = /\[([^\]]+)\]|\{([^}]+)\}/g

/** Splits a marked-up line into coloured runs, dropping the braces. */
export function parseCopyLine(line: string): CopyRun[] {
	const runs: CopyRun[] = []
	let index = 0
	for (const match of line.matchAll(MARKUP)) {
		const at = match.index ?? index
		if (at > index) runs.push({ text: line.slice(index, at), color: UI.text })
		const key = match[1]
		runs.push({
			// A key is written with its brackets: the run keeps them, so the copy
			// still says [ЛКМ] and not a stray word in the middle of a sentence.
			text: key !== undefined ? `[${key}]` : (match[2] ?? ''),
			color: key !== undefined ? KEY_TONE : RULE_TONE
		})
		index = at + match[0].length
	}
	if (index < line.length) runs.push({ text: line.slice(index), color: UI.text })
	return runs
}

export interface CopyLayout {
	/** Left edge the bullets hang off: the copy starts one indent to the right. */
	x: number
	y: number
	/** Wrap width of the copy column, in virtual pixels. */
	width: number
	size: number
	lineHeight: number
	weight?: number
	/** Overall ink alpha; the manual keeps its copy a touch under full white. */
	alpha?: number
}

/** One indent for the bullet that hangs in front of the rule. */
export const COPY_INDENT = 9

/**
 * Paints one rule of copy with its colours and wrapping, and returns the height
 * it took.
 *
 * The wrap is measured by Pixi itself on the *plain* text (`CanvasTextMetrics`
 * with `wordWrap`), so the breaks land exactly where a single-colour `Text` of
 * the same string would have put them; the coloured runs are then rebuilt line
 * by line from the same character offsets. A caller stacks rules by adding the
 * returned height, which is what the existing wrapped `Text` gave it.
 */
export function drawCopy(parent: Container, line: string, layout: CopyLayout): number {
	const runs = parseCopyLine(line)
	const plain = runs.map((run) => run.text).join('')
	if (plain.length === 0) return 0

	// The measuring label is the wrap itself: same style, same column, so the
	// lines Pixi breaks here are the lines a plain `Text` would draw.
	const probe = makeText(plain, {
		size: layout.size,
		weight: layout.weight,
		lineHeight: layout.lineHeight,
		wordWrapWidth: layout.width
	})
	const metrics = CanvasTextMetrics.measureText(plain, probe.style, undefined, true)
	probe.destroy()

	const colors: number[] = []
	for (const run of runs) {
		for (let index = 0; index < run.text.length; index += 1) colors.push(run.color)
	}

	let cursor = 0
	let row = 0
	for (const wrapped of metrics.lines) {
		// The wrapped line is a slice of the plain copy; `indexOf` from the
		// previous slice keeps the colours aligned even when the same word comes
		// up twice in one rule.
		const start = Math.max(cursor, plain.indexOf(wrapped, cursor))
		const end = start + wrapped.length
		cursor = end
		if (wrapped.length > 0) {
			paintRun(parent, wrapped, colors, start, layout, row)
		}
		row += 1
	}
	return row * layout.lineHeight
}

/** Lays one wrapped row out as one label per colour run. */
function paintRun(
	parent: Container,
	text: string,
	colors: readonly number[],
	offset: number,
	layout: CopyLayout,
	row: number
): void {
	const y = layout.y + row * layout.lineHeight
	let pen = layout.x + COPY_INDENT
	let from = 0
	while (from < text.length) {
		const color = colors[offset + from] ?? UI.text
		let to = from + 1
		while (to < text.length && (colors[offset + to] ?? UI.text) === color) to += 1
		pen = placeRun(parent, text.slice(from, to), color, pen, y, layout)
		from = to
	}
}

/**
 * Places one label so its pen sits on `pen`, and returns where the next run's
 * pen goes.
 *
 * `makeText` anchors a label on its ink rather than on its advance, so a run
 * positioned at `x` would start its letters there and lose the blank advance in
 * front of them. The pen is recovered from the anchor the label already carries
 * (`anchor.x * width` is the distance from the box's left edge to the ink), and
 * the next pen is the label's own advance width — the same sum Pixi would have
 * made inside one label.
 */
function placeRun(
	parent: Container,
	value: string,
	color: number,
	pen: number,
	y: number,
	layout: CopyLayout
): number {
	const label: Text = makeText(value, {
		size: layout.size,
		weight: layout.weight,
		color,
		lineHeight: layout.lineHeight,
		alpha: layout.alpha ?? 1
	})
	label.position.set(Math.round(pen + label.anchor.x * label.width), y)
	parent.addChild(label)
	return pen + label.width
}

import { VIEW } from '../config'

/**
 * Sizes of the interface for the current input.
 *
 * The frame stays 480×270 and the scenes are not redrawn for a phone, so the
 * only thing a finger changes is how big the controls and their captions are.
 * Everything a screen builds goes through this table instead of hard-coding a
 * second set of numbers: on a fine pointer every helper returns its argument,
 * so the desktop layout is exactly the one that shipped.
 *
 * The scale is taken from the **landscape** fit, not from the current
 * orientation: a phone that boots in portrait would otherwise size its controls
 * from a half-size frame, and its pause dialog would arrive differently
 * depending on which way the handset happened to be held.
 */

/** A control the player aims at: HUD buttons, dialog rows, menu entries. */
export const MAIN_TARGET = 44
/** A control that is part of a bigger block: tabs, window closings. */
export const SECONDARY_TARGET = 36

/**
 * Ceiling on how much a control may grow. On a 480 px frame a 16 px icon has
 * plenty of room to double; on a tiny one it would swallow the water it sits
 * on, so the growth stops and the `minCss` floor wins by failing.
 */
const TARGET_GROWTH = 2.2

/** Labels and body copy grow a little, not by the control's factor. */
const TEXT_BUMP = 1.1

/** Box every square interface mark is drawn in, in virtual pixels. */
export const ICON_BOX = 16

/**
 * Side of a square control that holds one icon — the HUD's codex and pause
 * pair, the fullscreen toggle in either corner.
 *
 * The mark lives in a 16 px box, and a 16 px frame left it flush with the
 * button's 1 px border and its 2 px bottom shadow: the glyph read as painted on
 * the frame instead of set into it. Four pixels of air keep the mark inside the
 * button at every size, and a touch screen still grows it towards
 * `MAIN_TARGET` through `ui.target`.
 */
export const ICON_CONTROL = 20

/**
 * Magnification for a pixel glyph: whole steps only.
 *
 * A 31 px control wants its 16 px mark nearly doubled, and 1.94× resamples a
 * hand-drawn pixel icon into soft edges — the one thing the interface is built
 * not to do. The steps are safe to overshoot: the painted marks live inside a
 * 10 px box, so a 2× scale still clears a 31 px frame; a tile sprite fills its
 * own 16 px canvas and steps down to fit (see `Button`).
 */
export function iconSteps(size: number): number {
	return Math.max(1, Math.round(size / ICON_BOX))
}

export interface UiMetrics {
	/** True on a coarse-pointer device: touch sizes, no painted cursor. */
	readonly touch: boolean
	/** Virtual px per CSS px of the landscape fit; always 1 on a fine pointer. */
	readonly fitScale: number
	/**
	 * Size of an interactive control, in virtual pixels: `base` grown towards
	 * `minCss` CSS pixels and rounded up, because a target rounded down is a
	 * target under the threshold.
	 */
	target(base: number, minCss?: number): number
	/** Size of a label or a line of copy, in virtual pixels. */
	font(base: number): number
	/** A spacing that has to follow the controls; same value on a fine pointer. */
	pick<T>(mouse: T, finger: T): T
}

const MOUSE_METRICS: UiMetrics = {
	touch: false,
	fitScale: 1,
	target(base: number): number {
		return base
	},
	font(base: number): number {
		return base
	},
	pick<T>(mouse: T, _finger: T): T {
		return mouse
	}
}

function touchMetrics(fitScale: number): UiMetrics {
	return {
		touch: true,
		fitScale,
		target(base: number, minCss: number = MAIN_TARGET): number {
			return Math.ceil(Math.max(base, Math.min(base * TARGET_GROWTH, minCss / fitScale)))
		},
		font(base: number): number {
			return Math.ceil(base * TEXT_BUMP)
		},
		pick<T>(_mouse: T, finger: T): T {
			return finger
		}
	}
}

let active: UiMetrics = MOUSE_METRICS

/** The sizes every screen reads while it is being built. */
export function uiMetrics(): UiMetrics {
	return active
}

/**
 * Installs the profile for the session. Called once, from the host's own
 * constructor, before any screen is built; rotating the handset does not
 * rebuild the layout (that would reflow the interface under the player's
 * hand), it only re-fits the frame.
 */
export function applyUiMetrics(width: number, height: number, touch: boolean): void {
	if (!touch) {
		active = MOUSE_METRICS
		return
	}
	const w = Math.max(1, width)
	const h = Math.max(1, height)
	const fit = Math.min(Math.max(w, h) / VIEW.width, Math.min(w, h) / VIEW.height)
	active = touchMetrics(fit > 0 ? fit : 1)
}

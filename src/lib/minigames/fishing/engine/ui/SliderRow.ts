import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import { CURSORS } from '../cursors'
import { clamp } from '../utils'
import { UI } from './palette'
import { makeText, setText } from './theme'
import { anchorInk } from './textInk'

/** What one row of the dev slider column edits. */
export interface SliderSpec {
	label: string
	min: number
	max: number
	/** Smallest change a drag can make: the readout prints this much. */
	step: number
	/** How the value is printed, e.g. `"50 %"` or `"0.70 с"`. */
	format: (value: number) => string
}

/**
 * Row geometry inside the 480×270 frame. The readout is wide on purpose: it is
 * the number the tuner is reading, so it is set at 8 px and in ice white while
 * the caption stays a 6 px label in the muted colour.
 */
const ROW = { height: 16, label: 84, track: 88, value: 36 } as const
const TRACK_X = ROW.label + 4
const VALUE_RIGHT = TRACK_X + ROW.track + ROW.value

/**
 * One dev slider: caption, track, value.
 *
 * The audio panel's faders belong to audio channels and read `/`-formatted
 * gains, so they are not reusable here; this is the smallest honest slider that
 * still drags and prints. It owns no state beyond the last value it drew — the
 * number lives in the tuning table the panel is editing, and every drag writes
 * straight back into it, which is what makes a slider a live change in a running
 * fight.
 *
 * The track is also the row's hover target: the panel shows one line of help for
 * whatever the pointer is on, and the caption is too short to carry a rule.
 */
export class SliderRow extends Container {
	private readonly spec: SliderSpec
	private readonly track = new Graphics()
	private readonly valueText: Text
	private readonly onInput: (value: number) => void
	private dragging = false
	private value = 0

	constructor(
		spec: SliderSpec,
		get: () => number,
		onInput: (value: number) => void,
		onHover?: (entered: boolean) => void
	) {
		super()
		this.spec = spec
		this.onInput = onInput

		const label = makeText(spec.label, {
			size: 6,
			weight: 700,
			color: UI.textMuted
		})
		anchorInk(label, 'left', 'center')
		label.position.set(0, ROW.height / 2)
		this.addChild(label)

		this.track.position.set(TRACK_X, ROW.height / 2)
		this.track.eventMode = 'static'
		this.track.cursor = CURSORS.pointer
		this.track.hitArea = new Rectangle(-4, -8, ROW.track + 8, 16)
		this.track.on('pointerdown', (event: FederatedPointerEvent) => {
			this.dragging = true
			this.track.on('globalpointermove', this.onDrag)
			this.setFromPointer(event)
		})
		this.track.on('pointerup', () => this.endDrag())
		this.track.on('pointerupoutside', () => this.endDrag())
		if (onHover) {
			this.track.on('pointerover', () => onHover(true))
			this.track.on('pointerout', () => onHover(false))
		}
		this.addChild(this.track)

		this.valueText = makeText('', {
			size: 8,
			weight: 700,
			color: UI.primary,
			align: 'right'
		})
		anchorInk(this.valueText, 'right', 'center')
		this.valueText.position.set(VALUE_RIGHT, ROW.height / 2)
		this.addChild(this.valueText)

		this.setValue(get())
	}

	/** Width of the whole row; the panel lays its column out from it. */
	static get width(): number {
		return VALUE_RIGHT
	}

	/** Show `value` and redraw the track. Does not write back. */
	setValue(value: number): void {
		this.value = clamp(value, this.spec.min, this.spec.max)
		setText(this.valueText, this.spec.format(this.value))
		this.drawTrack()
	}

	private onDrag = (event: FederatedPointerEvent): void => {
		this.setFromPointer(event)
	}

	private endDrag(): void {
		if (!this.dragging) return
		this.dragging = false
		this.track.off('globalpointermove', this.onDrag)
	}

	private setFromPointer(event: FederatedPointerEvent): void {
		const local = event.getLocalPosition(this)
		const share = clamp((local.x - TRACK_X) / ROW.track)
		const raw = this.spec.min + (this.spec.max - this.spec.min) * share
		const stepped =
			Math.round((raw - this.spec.min) / this.spec.step) * this.spec.step + this.spec.min
		// Snap to the step the readout prints, so the number on screen and the
		// number in the fight never disagree by a hidden fraction.
		const next = clamp(Number(stepped.toFixed(4)), this.spec.min, this.spec.max)
		if (next === this.value) return
		this.setValue(next)
		this.onInput(next)
	}

	private drawTrack(): void {
		const width = ROW.track
		const span = this.spec.max - this.spec.min || 1
		const share = (this.value - this.spec.min) / span
		const filled = Math.max(0, Math.round(width * share))
		const g = this.track
		g.clear()
		g.rect(0, -3, width, 6).fill({ color: UI.ink, alpha: 0.75 })
		g.rect(0, -2, width, 4).fill({ color: UI.panelAlt, alpha: 0.9 })
		if (filled > 0) {
			g.rect(0, -2, filled, 4).fill(UI.ice)
			g.rect(0, -2, filled, 1).fill({ color: UI.text, alpha: 0.45 })
		}
		g.rect(0, -3, width, 6).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.55
		})
		g.rect(filled - 1, -5, 3, 10).fill(UI.ink)
		g.rect(filled, -4, 1, 8).fill(UI.text)
	}
}

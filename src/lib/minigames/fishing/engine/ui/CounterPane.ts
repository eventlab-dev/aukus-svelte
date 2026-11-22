import { Container, Graphics } from 'pixi.js'
import type { Text } from 'pixi.js'
import { zoneTuning } from '../game/fight/zoneTuning'
import { drawCounterLock } from '../game/fightView/counterLock'
import { Button } from './Button'
import { ScrollColumn } from './ScrollColumn'
import { SliderRow } from './SliderRow'
import type { CounterState } from './ZonePreview'
import { COUNTER_ROWS, CUE_ROWS, LOCK_ROWS, ZONE_TEXT } from './zoneRows'
import { makeText, setText } from './theme'

/** Room inside the scrolling column. */
const INSET = { x: 6, y: 6 } as const
const ROW_PITCH = 18
/** The live indicator block above the faders. */
const GAUGE = { height: 76 } as const
/** The padlock sample on the left of the indicator, over a mock waterline. */
const SAMPLE = { x: 22, y: 30, width: 44, height: 44 } as const
const ROW_TOP = GAUGE.height + 8
const LOCK_CAPTION = ROW_TOP + COUNTER_ROWS.length * ROW_PITCH + 6
const LOCK_TOP = LOCK_CAPTION + 12
const SIDE_TOP = LOCK_TOP + LOCK_ROWS.length * ROW_PITCH + 4
const CUE_CAPTION = SIDE_TOP + 24
const CUE_TOP = CUE_CAPTION + 12

/**
 * The «КОНТР» tab: the gesture's live indicator, the padlock's sample and the
 * numbers behind both.
 *
 * The indicator reads the preview's own state — the same model the click drives —
 * so while a fight plays it says whether the window is open, whether the press
 * landed in the band, how far the drag has gone against its threshold and
 * whether that combination would land right now. Tuning a gesture without seeing
 * the gesture is guesswork; this is the missing pair of eyes, and the sample on
 * the left is the same `drawCounterLock` the fight calls.
 */
export class CounterPane extends Container {
	private readonly scroll: ScrollColumn
	private readonly rows: Array<{ key: string; row: SliderRow }> = []
	private readonly windowText: Text
	private readonly wedgeText: Text
	private readonly dragText: Text
	private readonly readyText: Text
	private readonly sample = new Graphics()
	private readonly dragBar = new Graphics()
	private readonly sideButtons = new Map<boolean, Button>()
	private dragValue = 0

	constructor(width: number, height: number, onHelp: (message: string | null) => void) {
		super()
		this.scroll = new ScrollColumn(width, height)
		this.addChild(this.scroll)

		const label = (value: string, y: number, size = 6): Text => {
			const text = makeText(value, { size, color: 0xc2cdf0 })
			text.position.set(INSET.x, INSET.y + y)
			this.scroll.content.addChild(text)
			return text
		}
		// The padlock sample gets its own little well; the status lines sit beside
		// it, because the mark is the thing the eye has to judge.
		const frame = new Graphics()
		frame.rect(INSET.x, INSET.y, SAMPLE.width, SAMPLE.height).fill({ color: 0x141a3d, alpha: 0.5 })
		frame
			.rect(INSET.x, INSET.y, SAMPLE.width, SAMPLE.height)
			.stroke({ width: 1, color: 0x8299e6, alpha: 0.4 })
		this.scroll.content.addChild(frame)
		this.sample.position.set(INSET.x, INSET.y)
		this.scroll.content.addChild(this.sample)

		const lines = INSET.x + SAMPLE.width + 8
		const line = (y: number): Text => {
			const text = makeText('', { size: 6, color: 0xc2cdf0 })
			text.position.set(lines, INSET.y + y)
			this.scroll.content.addChild(text)
			return text
		}
		this.windowText = line(2)
		this.wedgeText = line(14)
		this.dragText = line(26)
		this.readyText = line(44)
		this.dragBar.position.set(lines, INSET.y + 34)
		this.scroll.content.addChild(this.dragBar)

		COUNTER_ROWS.forEach((spec, index) => {
			const row = new SliderRow(
				spec,
				() => zoneTuning[spec.key] as number,
				(value) => {
					;(zoneTuning[spec.key] as number) = value
				},
				(entered) => onHelp(entered ? spec.help : null)
			)
			row.position.set(INSET.x, INSET.y + ROW_TOP + index * ROW_PITCH)
			this.scroll.content.addChild(row)
			this.rows.push({ key: spec.key, row })
		})

		label(ZONE_TEXT.lockCaption, LOCK_CAPTION, 7)
		LOCK_ROWS.forEach((spec, index) => {
			const row = new SliderRow(
				spec,
				() => zoneTuning[spec.key] as number,
				(value) => {
					;(zoneTuning[spec.key] as number) = value
					this.drawSample()
				},
				(entered) => onHelp(entered ? spec.help : null)
			)
			row.position.set(INSET.x, INSET.y + LOCK_TOP + index * ROW_PITCH)
			this.scroll.content.addChild(row)
			this.rows.push({ key: spec.key, row })
		})

		// Where the lock hangs: on the float the player watches, or on the fish.
		const sideCaption = makeText(ZONE_TEXT.lockWhere, {
			size: 6,
			weight: 700,
			color: 0xc2cdf0
		})
		sideCaption.position.set(INSET.x, INSET.y + SIDE_TOP + 4)
		this.scroll.content.addChild(sideCaption)
		const buttonWidth = 62
		;([true, false] as const).forEach((atFloat, index) => {
			const button = new Button({
				label: atFloat ? ZONE_TEXT.lockOnFloat : ZONE_TEXT.lockOnFish,
				width: buttonWidth,
				height: 14,
				size: 6,
				variant: 'secondary',
				onClick: () => {
					zoneTuning.lockAtFloat = atFloat
					this.refresh()
				}
			})
			button.position.set(INSET.x + 78 + index * (buttonWidth + 4), INSET.y + SIDE_TOP)
			this.scroll.content.addChild(button)
			this.sideButtons.set(atFloat, button)
		})

		// The receipt ring of a landed counter, drawn around the same float.
		label(ZONE_TEXT.cueCaption, CUE_CAPTION, 7)
		CUE_ROWS.forEach((spec, index) => {
			const row = new SliderRow(
				spec,
				() => zoneTuning[spec.key] as number,
				(value) => {
					;(zoneTuning[spec.key] as number) = value
				},
				(entered) => onHelp(entered ? spec.help : null)
			)
			row.position.set(INSET.x, INSET.y + CUE_TOP + index * ROW_PITCH)
			this.scroll.content.addChild(row)
			this.rows.push({ key: spec.key, row })
		})

		this.scroll.setContentHeight(INSET.y + CUE_TOP + CUE_ROWS.length * ROW_PITCH)
		this.refresh()
	}

	/** Pull the faders, the anchor choice and the sample from the live table. */
	refresh(): void {
		for (const entry of this.rows) entry.row.setValue(this.valueOf(entry.key))
		for (const [atFloat, button] of this.sideButtons) {
			button.setSelected(atFloat === zoneTuning.lockAtFloat)
		}
		this.drawSample()
		this.drawBar()
	}

	/** Print the current state of the gesture, once per frame. */
	update(state: CounterState): void {
		const open = state.open > 0
		setText(this.windowText, open ? `ОКНО: ${state.open.toFixed(2)} С` : 'ОКНО: ЗАКРЫТО')
		setText(this.wedgeText, `СЕКТОР: ${state.inWedge ? 'ДА' : 'НЕТ'}`)
		setText(
			this.dragText,
			`ПРОТЯЖКА ${state.drag.toFixed(0)}/${zoneTuning.counterDrag.toFixed(0)} PX`
		)
		setText(this.readyText, `ГОТОВ: ${state.ready ? 'ДА' : 'НЕТ'}`)
		const next = Math.min(1, state.drag / Math.max(1, zoneTuning.counterDrag))
		if (Math.abs(next - this.dragValue) > 0.005) {
			this.dragValue = next
			this.drawBar()
		}
	}

	private valueOf(key: string): number {
		return zoneTuning[key as keyof typeof zoneTuning] as number
	}

	/** The mark itself, over a mock waterline, updated as its numbers move. */
	private drawSample(): void {
		const g = this.sample
		g.clear()
		g.rect(0, SAMPLE.height - 12, SAMPLE.width, 1).fill({
			color: 0x8fd8ff,
			alpha: 0.35
		})
		g.ellipse(SAMPLE.width / 2, SAMPLE.height - 11, 3, 1.5).fill({
			color: 0xeef2ff,
			alpha: 0.8
		})
		drawCounterLock(g, SAMPLE.width / 2, SAMPLE.height - 11, 1)
	}

	/** The drag's progress against its threshold, with the threshold marked. */
	private drawBar(): void {
		const width = 140
		const g = this.dragBar
		g.clear()
		g.rect(0, 0, width, 5).fill({ color: 0x141a3d, alpha: 0.6 })
		g.rect(0, 0, Math.round(width * this.dragValue), 5).fill(
			this.dragValue >= 1 ? 0x6fd6b0 : 0x8fd8ff
		)
		g.rect(0, 0, width, 5).stroke({ width: 1, color: 0x8299e6, alpha: 0.5 })
		g.rect(width - 1, -2, 1, 9).fill({ color: 0xeef2ff, alpha: 0.9 })
	}
}

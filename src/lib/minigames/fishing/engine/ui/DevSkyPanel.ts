import { Container, Graphics, Text } from 'pixi.js'
import { TEXT, WEATHER_LABEL } from '../texts'
import type { WeatherId } from '../types'
import { WEATHER_IDS } from '../world'
import { liveWaterLayer } from '../game/scenes/pixelWater'
import type { WaterLook } from '../game/scenes/waterLook'
import { Button } from './Button'
import { UI } from './palette'
import { drawPanel, makeText, setText } from './theme'
import { anchorInk } from './textInk'
import { WATER_ROWS, nudgeWater, resetWater } from './devWaterRows'

/**
 * Panel geometry, in the 480×270 virtual frame.
 *
 * One window for the two things the dev build has to judge by eye: what the sky
 * is doing and how the water under it reads. The weather and time rows sit on
 * top, the water knobs under them in two columns, and the whole board is one
 * hotkey away.
 */
const PANEL = { x: 8, y: 8, width: 294, height: 142 } as const
/** Left gutter holding the row captions. */
const GUTTER = 42
/** One choice in a sky row. */
const ROW = { width: 47, height: 14, gap: 2 } as const
const ROW_X = PANEL.x + GUTTER
const ROW_TOP = [PANEL.y + 20, PANEL.y + 36] as const
/** Water rows: two columns of three, each a caption, `-`, value and `+`. */
const WATER = {
	top: PANEL.y + 68,
	// A gap of three pixels between the stepper rows: at the row height they
	// stacked into one tall column of `-` and `+` instead of three rows.
	pitch: 17,
	column: 148,
	/** Offsets inside a column. */
	step: 62,
	value: 112,
	plus: 116
} as const
const STEP = { width: 14, height: 14 } as const

/**
 * The hours the panel can pin, in minutes since midnight. They are the four
 * faces of the same day the palette already blends between — deep night, the
 * dawn ramp, full daylight and the dusk ramp — so a front can be judged under
 * every light it will ever be drawn in.
 */
const PRESETS: ReadonlyArray<{ minutes: number; label: string }> = [
	{ minutes: 120, label: TEXT.devtools.timePresets.night },
	{ minutes: 480, label: TEXT.devtools.timePresets.morning },
	{ minutes: 780, label: TEXT.devtools.timePresets.day },
	{ minutes: 1140, label: TEXT.devtools.timePresets.evening }
]

export interface DevSkyDeps {
	/** Front of the water body the player is on right now. */
	weather(): WeatherId
	/** Sets the front for that water body and persists it. */
	onWeather(weather: WeatherId): void
	/** The pinned hour, or null while the wall clock owns it. */
	pinned(): number | null
	/** Pins an hour, or returns to the wall clock with null. */
	onTime(minutes: number | null): void
	onClose(): void
}

/**
 * Dev-only sky and water inspector (`F3`).
 *
 * The weather is rolled by the world clock, the hour follows the player's own
 * clock and the water is a table of numbers in `waterLook.ts`; none of the three
 * can be judged from the source. This window pins a front, pins an hour and
 * turns the water knobs while the surface runs, so a value can be looked at
 * instead of guessed and then written back to the config by hand. It only opens
 * on its hotkey: nothing in the interface points at it.
 */
export class DevSkyPanel extends Container {
	private readonly deps: DevSkyDeps
	private readonly weatherButtons = new Map<WeatherId, Button>()
	private readonly timeButtons: Button[] = []
	private readonly waterValues: Text[] = []
	private readonly auto: Button
	/** The water look as it was when the panel opened, for «СБРОС». */
	private baseline: WaterLook | null = null
	private open_ = false

	constructor(deps: DevSkyDeps) {
		super()
		this.deps = deps
		this.visible = false
		// The water numbers belong to the live layer, and a new scene rebuilds it:
		// refreshing on render keeps the readouts describing the water on screen.
		this.onRender = () => {
			if (this.open_) this.refresh()
		}

		const panel = new Graphics()
		drawPanel(panel, PANEL.x, PANEL.y, PANEL.width, PANEL.height, {
			fill: UI.panel,
			alpha: 0.97,
			shadow: true
		})
		this.addChild(panel)

		const title = makeText(TEXT.devtools.sky, {
			size: 7,
			weight: 800,
			color: UI.text,
			letterSpacing: 0.6
		})
		title.position.set(PANEL.x + 8, PANEL.y + 5)
		this.addChild(title)

		const hint = makeText(TEXT.devtools.skyHint, {
			size: 6,
			color: UI.textMuted,
			align: 'right'
		})
		hint.anchor.set(1, 0)
		hint.position.set(PANEL.x + PANEL.width - 8, PANEL.y + 6)
		this.addChild(hint)

		// Row captions sit in their own gutter, so both rows start on the same
		// column and read as one list of two settings instead of two windows.
		this.addCaption(TEXT.devtools.weatherRow, ROW_TOP[0], PANEL.x + 8)
		this.addCaption(TEXT.devtools.timeRow, ROW_TOP[1], PANEL.x + 8)
		this.addCaption(TEXT.devtools.waterRow, PANEL.y + 56, PANEL.x + 8, 0.6)

		WEATHER_IDS.forEach((id, index) => {
			this.weatherButtons.set(
				id,
				this.addChoice(WEATHER_LABEL[id], 0, index, () => {
					this.deps.onWeather(id)
					this.refresh()
				})
			)
		})

		// «сейчас» first: handing the sky back to the wall clock is the way out of
		// a pinned hour, so it belongs at the head of the row.
		this.auto = this.addChoice(TEXT.devtools.timeAuto, 1, 0, () => {
			this.deps.onTime(null)
			this.refresh()
		})
		this.timeButtons.push(this.auto)
		PRESETS.forEach((preset, index) => {
			const button = this.addChoice(preset.label, 1, index + 1, () => {
				this.deps.onTime(preset.minutes)
				this.refresh()
			})
			this.timeButtons.push(button)
		})

		WATER_ROWS.forEach((spec, index) => this.addWaterRow(spec.label, index))

		const resetButton = new Button({
			label: TEXT.devtools.reset,
			width: 66,
			height: 13,
			size: 6,
			onClick: () => this.reset()
		})
		resetButton.position.set(PANEL.x + 8, PANEL.y + 126)
		this.addChild(resetButton)
	}

	/** One gutter caption, vertically centred on its row's buttons. */
	private addCaption(label: string, top: number, x: number, letterSpacing = 0.4): Text {
		const caption = makeText(label, {
			size: 6,
			color: UI.textMuted,
			letterSpacing
		})
		// `anchorInk` centres on the capitals, which is also the row's middle: the
		// caption shares that line with the buttons beside it.
		anchorInk(caption, 'left', 'center')
		caption.position.set(x, top + ROW.height / 2)
		this.addChild(caption)
		return caption
	}

	/** One choice of one sky row. `row` 0 is the fronts, `row` 1 the hours. */
	private addChoice(label: string, row: 0 | 1, slot: number, onClick: () => void): Button {
		const button = new Button({
			label,
			width: ROW.width,
			height: ROW.height,
			size: 6,
			onClick
		})
		button.position.set(ROW_X + slot * (ROW.width + ROW.gap), ROW_TOP[row] ?? ROW_TOP[1])
		this.addChild(button)
		return button
	}

	/** One water knob: caption, `-`, readout and `+`, in one of two columns. */
	private addWaterRow(label: string, index: number): void {
		const column = index < 3 ? 0 : 1
		const row = index % 3
		const x = PANEL.x + 8 + column * WATER.column
		const top = WATER.top + row * WATER.pitch

		const caption = makeText(label, {
			size: 6,
			color: UI.textMuted,
			letterSpacing: 0.4
		})
		anchorInk(caption, 'left', 'center')
		caption.position.set(x, top + STEP.height / 2)
		this.addChild(caption)

		const minus = new Button({
			label: '-',
			width: STEP.width,
			height: STEP.height,
			size: 8,
			marks: false,
			quiet: true,
			onClick: () => this.move(index, -1)
		})
		minus.position.set(x + WATER.step, top)
		this.addChild(minus)

		const value = makeText('—', {
			size: 6,
			color: UI.text,
			align: 'right'
		})
		anchorInk(value, 'right', 'center')
		value.position.set(x + WATER.value, top + STEP.height / 2)
		this.addChild(value)
		this.waterValues.push(value)

		const plus = new Button({
			label: '+',
			width: STEP.width,
			height: STEP.height,
			size: 8,
			marks: false,
			quiet: true,
			onClick: () => this.move(index, 1)
		})
		plus.position.set(x + WATER.plus, top)
		this.addChild(plus)
	}

	/** One click on `-` or `+`: move the row's value and apply it live. */
	private move(index: number, direction: number): void {
		nudgeWater(index, direction, this.baseline)
		this.refresh()
	}

	get isOpen(): boolean {
		return this.open_
	}

	open(): void {
		const layer = liveWaterLayer()
		this.baseline = layer ? { ...layer.look } : null
		this.open_ = true
		this.visible = true
		this.refresh()
	}

	close(): void {
		this.open_ = false
		this.visible = false
	}

	/** Marks the live front, the pinned hour and every water number. */
	refresh(): void {
		const weather = this.deps.weather()
		for (const [id, button] of this.weatherButtons) {
			button.setSelected(id === weather)
		}
		const pinned = this.deps.pinned()
		const active = pinned === null ? this.auto : this.timeButtons[pinnedSlot(pinned)]
		for (const button of this.timeButtons) {
			button.setSelected(button === active)
		}

		const layer = liveWaterLayer()
		WATER_ROWS.forEach((spec, index) => {
			const label = this.waterValues[index]
			if (!label) return
			setText(label, layer ? spec.format(spec.read(layer.look, layer.speed)) : '—')
		})
	}

	/** Puts every water number back where the panel found it. */
	reset(): void {
		resetWater(this.baseline)
		this.refresh()
	}

	/** `F3` / `Escape` while open; true when the panel consumed the key. */
	handleKey(event: KeyboardEvent): boolean {
		if (!this.open_) return false
		if (event.code === 'Escape' || event.code === 'F3') {
			this.deps.onClose()
			return true
		}
		return false
	}
}

/** Index of the preset that pins this minute, or 0 when it is not one of them. */
function pinnedSlot(minutes: number): number {
	const index = PRESETS.findIndex((preset) => preset.minutes === minutes)
	return index < 0 ? 0 : index + 1
}

import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import { formatGain, type MixChannel, type MixChannelDef } from '../../audioMix'
import { CURSORS } from '../../cursors'
import { clamp } from '../../utils'
import { Button } from '../Button'
import { UI } from '../palette'
import { drawPlayIcon, makeText, setText } from '../theme'
import { anchorInk } from '../textInk'
import { GROUP_COLOR, NAME_X, ROW, ROW_END, TRACK_X } from './layout'

export class MixRow extends Container {
	private readonly def: MixChannelDef
	private readonly trackWidth = ROW.track
	private readonly track = new Graphics()
	private readonly valueText: Text
	private readonly onChange: (channel: MixChannel, value: number) => void
	private readonly onPreview: (channel: MixChannel) => void
	private dragging = false
	private value = 0

	constructor(
		def: MixChannelDef,
		onChange: (channel: MixChannel, value: number) => void,
		onPreview: (channel: MixChannel) => void
	) {
		super()
		this.def = def
		this.onChange = onChange
		this.onPreview = onPreview

		// Audition button first: a fader has to be audible on its own without
		// waiting for the game to trigger it, and a control the panel draws is
		// easier to find than a name that happens to be clickable.
		const play = new Button({
			width: ROW.play,
			height: ROW.height,
			variant: 'ghost',
			icon: (g) => drawPlayIcon(g, UI.text),
			onClick: () => this.onPreview(this.def.id),
			// Silent: the cue being auditioned is the sound, not the press.
			quiet: true
		})
		play.position.set(0, 0)
		this.addChild(play)

		const label = makeText(def.label, {
			size: 6,
			weight: 700,
			color: UI.text
		})
		anchorInk(label, 'left')
		label.position.set(NAME_X, ROW.height / 2)
		this.addChild(label)

		// The name stays a shortcut for the same preview, so a click anywhere on
		// the row's label plays the cue that button does.
		label.eventMode = 'static'
		label.cursor = CURSORS.pointer
		label.hitArea = new Rectangle(0, 0, ROW.name, ROW.height)
		label.on('pointertap', () => this.onPreview(this.def.id))

		this.track.position.set(TRACK_X, ROW.height / 2)
		this.track.eventMode = 'static'
		this.track.cursor = CURSORS.pointer
		this.track.hitArea = new Rectangle(-4, -7, this.trackWidth + 8, 14)
		this.track.on('pointerdown', (event: FederatedPointerEvent) => {
			this.dragging = true
			this.track.on('globalpointermove', this.onDrag)
			this.setFromPointer(event)
		})
		this.track.on('pointerup', () => this.endDrag())
		this.track.on('pointerupoutside', () => this.endDrag())
		this.addChild(this.track)

		this.valueText = makeText('0.00', {
			size: 6,
			weight: 700,
			color: UI.textMuted,
			align: 'right'
		})
		anchorInk(this.valueText, 'right')
		this.valueText.position.set(ROW_END, ROW.height / 2)
		this.addChild(this.valueText)

		this.setValue(0)
	}

	/** Gain shown by this fader. */
	setValue(value: number): void {
		this.value = clamp(value)
		setText(this.valueText, formatGain(this.value))
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
		const value = clamp((local.x - TRACK_X) / this.trackWidth)
		if (value === this.value) return
		this.setValue(value)
		this.onChange(this.def.id, value)
	}

	private drawTrack(): void {
		const g = this.track
		const width = this.trackWidth
		const filled = Math.max(0, Math.round(width * this.value))
		const color = GROUP_COLOR[this.def.group]
		g.clear()
		g.rect(0, -3, width, 6).fill({ color: UI.ink, alpha: 0.75 })
		g.rect(0, -2, width, 4).fill({ color: UI.panelAlt, alpha: 0.9 })
		if (filled > 0) {
			g.rect(0, -2, filled, 4).fill(color)
			g.rect(0, -2, filled, 1).fill({ color: UI.text, alpha: 0.45 })
		}
		g.rect(0, -3, width, 6).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.55
		})
		if (Math.abs(this.value - 1) < 0.001) {
			// Fully open: a bright rim marks the end of the travel.
			g.rect(width - 1, -3, 1, 6).fill(UI.primary)
		}
		g.rect(filled - 1, -5, 3, 10).fill(UI.ink)
		g.rect(filled, -4, 1, 8).fill(UI.text)
	}
}

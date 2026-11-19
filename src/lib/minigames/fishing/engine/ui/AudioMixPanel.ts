import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import type { AudioKit } from '../audio'
import {
	MIX_CHANNELS,
	MIX_GROUPS,
	type AudioMix,
	type MixChannel,
	type MixGroup
} from '../audioMix'
import { VIEW } from '../config'
import { CURSORS } from '../cursors'
import { TEXT } from '../texts'
import { Button } from './Button'
import { UI } from './palette'
import { drawPanel, makeText, setText } from './theme'
import { MixRow } from './mix/MixRow'
import { COLUMN, HEADER, LIST_TOP, PANEL, ROW } from './mix/layout'

export interface AudioMixPanelDeps {
	audio: AudioKit
	/** Keeps a tuning session across reloads. */
	onPersist(mix: AudioMix): void
	isMuted(): boolean
	onToggleMute(): void
	onClose(): void
}

/** One fader: name, track, gain readout. */

/**
 * Dev panel for the audio balance (F2).
 *
 * Every cue in the game is one fader here. Dragging writes through to the live
 * `AudioKit`, so the mix is heard while it is being built, and the panel keeps
 * the result on the device so a reload does not start from scratch.
 */
export class AudioMixPanel extends Container {
	private readonly deps: AudioMixPanelDeps
	private readonly rows = new Map<MixChannel, MixRow>()
	private readonly statusText: Text
	private readonly muteButton: Button
	private readonly blocker: Graphics
	private open_ = false

	constructor(deps: AudioMixPanelDeps) {
		super()
		this.deps = deps
		this.visible = false

		this.blocker = new Graphics()
		this.blocker.rect(0, 0, VIEW.width, VIEW.height).fill({ color: UI.scrim, alpha: 0.7 })
		this.blocker.eventMode = 'static'
		this.blocker.cursor = CURSORS.default
		this.blocker.hitArea = new Rectangle(0, 0, VIEW.width, VIEW.height)
		this.addChild(this.blocker)

		const panel = new Graphics()
		drawPanel(panel, PANEL.x, PANEL.y, PANEL.width, PANEL.height, {
			fill: UI.panel,
			alpha: 0.99,
			shadow: true
		})
		this.addChild(panel)

		const title = makeText('ЗВУК: БАЛАНС', {
			size: 11,
			weight: 800,
			color: UI.text,
			letterSpacing: 1
		})
		title.position.set(PANEL.x + 14, PANEL.y + 9)
		this.addChild(title)

		const hint = makeText(TEXT.devtools.hint, {
			size: 6,
			color: UI.textMuted
		})
		hint.position.set(PANEL.x + 14, PANEL.y + 23)
		this.addChild(hint)

		this.buildRows()
		this.statusText = makeText('', {
			size: 6,
			color: UI.textMuted,
			align: 'center',
			wordWrapWidth: PANEL.width - 40
		})
		this.statusText.anchor.set(0.5, 0)
		this.statusText.position.set(PANEL.x + PANEL.width / 2, PANEL.y + PANEL.height - 17)
		this.addChild(this.statusText)

		const buttonY = PANEL.y + PANEL.height - 40
		const buttonWidth = 76
		const gap = 8
		const total = buttonWidth * 3 + gap * 2
		const startX = PANEL.x + (PANEL.width - total) / 2
		const at = (index: number): number => startX + index * (buttonWidth + gap)

		const reset = new Button({
			label: TEXT.devtools.reset,
			width: buttonWidth,
			height: 18,
			size: 8,
			onClick: () => this.reset()
		})
		reset.position.set(at(0), buttonY)
		this.addChild(reset)

		this.muteButton = new Button({
			label: TEXT.devtools.sound,
			width: buttonWidth,
			height: 18,
			size: 8,
			onClick: () => {
				this.deps.onToggleMute()
				this.refreshMute()
			}
		})
		this.muteButton.position.set(at(1), buttonY)
		this.addChild(this.muteButton)

		const close = new Button({
			label: TEXT.devtools.close,
			width: buttonWidth,
			height: 18,
			size: 8,
			onClick: () => this.deps.onClose()
		})
		close.position.set(at(2), buttonY)
		this.addChild(close)
	}

	get isOpen(): boolean {
		return this.open_
	}

	open(): void {
		this.open_ = true
		this.visible = true
		this.setMix(this.deps.audio.mixValues)
		this.refreshMute()
		this.setStatus('')
	}

	close(): void {
		this.open_ = false
		this.visible = false
	}

	/** Pulls every fader from the live mix. */
	setMix(mix: AudioMix): void {
		for (const [channel, row] of this.rows) row.setValue(mix[channel])
	}

	/** F2 / Escape; returns true when the panel consumed the key. */
	handleKey(event: KeyboardEvent): boolean {
		if (!this.open_) return false
		if (event.code === 'Escape' || event.code === 'F2') {
			this.deps.onClose()
			return true
		}
		return false
	}

	private buildRows(): void {
		const left = PANEL.x + 14
		const right = left + COLUMN.width + COLUMN.gap
		let y = LIST_TOP
		let column = 0
		let group: MixGroup | null = null
		let firstHeader = true

		for (const channel of MIX_CHANNELS) {
			if (channel.group !== group) {
				group = channel.group
				if (column === 0 && y > LIST_TOP + 60) {
					// The left column ran out; continue at the top of the right one.
					column = 1
					y = LIST_TOP
					firstHeader = true
				} else if (!firstHeader) {
					// A little air between groups, so a title never crowds the row above.
					y += 3
				}
				firstHeader = false
				const label = MIX_GROUPS.find((item) => item.id === group)?.label ?? ''
				const header = makeText(label, {
					size: 6,
					weight: 800,
					color: UI.periwinkleLight,
					letterSpacing: 1
				})
				header.position.set(column === 0 ? left : right, y)
				this.addChild(header)
				y += HEADER
			}

			const row = new MixRow(
				channel,
				(id, value) => this.handleChange(id, value),
				(id) => this.deps.audio.preview(id)
			)
			row.position.set(column === 0 ? left : right, y)
			this.addChild(row)
			this.rows.set(channel.id, row)
			y += ROW.height
		}
	}

	private handleChange(channel: MixChannel, value: number): void {
		this.deps.audio.setChannel(channel, value)
		this.deps.onPersist(this.deps.audio.mixValues)
		this.setStatus('')
	}

	private reset(): void {
		const mix = this.deps.audio.defaultMix
		this.deps.audio.setMix(mix)
		this.setMix(mix)
		this.deps.onPersist(mix)
		this.setStatus(TEXT.devtools.resetDone)
	}

	private refreshMute(): void {
		const muted = this.deps.isMuted()
		this.muteButton.setLabel(muted ? TEXT.devtools.soundOff : TEXT.devtools.soundOn)
	}

	private setStatus(message: string): void {
		setText(this.statusText, message)
	}
}

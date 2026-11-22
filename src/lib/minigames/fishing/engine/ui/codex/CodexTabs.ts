import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import { CURSORS } from '../../cursors'
import { UI } from '../palette'
import { makeText } from '../theme'
import { anchorInk } from '../textInk'
import { TapGuard } from '../tapSlop'

export interface CodexTabsOptions {
	labels: readonly string[]
	width: number
	height: number
	onPick: (index: number) => void
	onHover: () => void
	/** Label size, in virtual pixels; the screens pass their own touch size. */
	fontSize?: number
}

/**
 * Water-body switcher: one segmented bar, not three buttons.
 *
 * The three waters are a single choice, so they share one sunken trough with a
 * hairline between the segments, and only the selected segment is raised: an
 * ice-white tab with dark copy. That reads as a picker rather than as a row of
 * page buttons, which is what the old three separate buttons did.
 */
export class CodexTabs extends Container {
	private readonly track = new Graphics()
	private readonly labels: Text[] = []
	private readonly tick: number
	private readonly widthValue: number
	private readonly heightValue: number
	private readonly onPick: (index: number) => void
	private readonly onHover: () => void
	private readonly tap = new TapGuard()
	private selected = 0
	private hovered = -1

	constructor(options: CodexTabsOptions) {
		super()
		this.onPick = options.onPick
		this.onHover = options.onHover
		this.widthValue = options.width
		this.heightValue = options.height
		this.tick = options.width / options.labels.length

		this.addChild(this.track)
		options.labels.forEach((label, index) => {
			const text = makeText(label, {
				size: options.fontSize ?? 8,
				weight: 700,
				color: UI.textMuted,
				align: 'center'
			})
			anchorInk(text, 'center')
			text.position.set(this.tick * (index + 0.5), this.heightValue / 2)
			this.labels.push(text)
			this.addChild(text)
		})

		this.eventMode = 'static'
		this.cursor = CURSORS.pointer
		this.hitArea = new Rectangle(0, 0, this.widthValue, this.heightValue)
		this.on('pointermove', (event) => {
			// A finger does not hover: on touch the segment lights under the press
			// instead, and a stale highlight here read as a stuck tab.
			if (event.pointerType === 'touch') return
			const index = this.indexAt(event.getLocalPosition(this).x)
			if (index === this.hovered) return
			this.hovered = index
			this.onHover()
			this.redraw()
		})
		this.on('pointerdown', (event) => {
			this.tap.start(event.global.x, event.global.y)
			if (event.pointerType !== 'touch') return
			const index = this.indexAt(event.getLocalPosition(this).x)
			if (index === this.hovered) return
			this.hovered = index
			this.redraw()
		})
		this.on('pointerup', (event) => {
			if (event.pointerType !== 'touch' || this.hovered < 0) return
			this.hovered = -1
			this.redraw()
		})
		this.on('pointerout', () => {
			this.hovered = -1
			this.redraw()
		})
		this.on('pointertap', (event) => {
			// Only a press that stayed on the same segment picks: dragging across the
			// bar on the way to the roster must not switch water bodies.
			if (!this.tap.end(event.global.x, event.global.y)) return
			const index = this.indexAt(event.getLocalPosition(this).x)
			if (index >= 0 && index < this.labels.length) this.onPick(index)
		})

		this.redraw()
	}

	setSelected(index: number): void {
		if (this.selected === index) return
		this.selected = index
		this.redraw()
	}

	/** Segment under a local x, or -1 outside the bar. */
	private indexAt(x: number): number {
		if (x < 0 || x >= this.widthValue) return -1
		return Math.min(this.labels.length - 1, Math.floor(x / this.tick))
	}

	private redraw(): void {
		const g = this.track
		const width = this.widthValue
		const height = this.heightValue
		g.clear()

		// Sunken trough: the shared frame the three segments sit in.
		g.rect(0, 0, width, height).fill({ color: UI.ink, alpha: 0.45 })
		g.rect(0, 0, width, height).stroke({
			width: 1,
			color: UI.ink,
			alignment: 0
		})

		/** Segment boundaries snapped to whole pixels, so no edge is half-lit. */
		const edge = (index: number): number => Math.round(index * this.tick)

		if (this.hovered >= 0 && this.hovered !== this.selected) {
			const left = edge(this.hovered)
			const right = edge(this.hovered + 1)
			g.rect(left + 1, 1, right - left - 2, height - 2).fill({
				color: UI.surface,
				alpha: 0.3
			})
		}

		// Hairlines between the segments keep "one control" readable. The two that
		// touch the raised tab are skipped: the tab carries its own ink border, and
		// a hairline right next to it read as a second, thicker edge cutting into
		// the selected segment.
		for (let index = 1; index < this.labels.length; index += 1) {
			if (index === this.selected || index === this.selected + 1) continue
			g.rect(edge(index), 3, 1, height - 6).fill({
				color: UI.periwinkle,
				alpha: 0.2
			})
		}

		// The selected segment is the only raised part: an ice tab in the trough.
		//
		// It is inset by one pixel on every side so its own ink border stays inside
		// the trough's frame. Flush with the trough, the last segment's right border
		// landed on the trough's border, and the raised tab read as having its right
		// edge cut off.
		const left = edge(this.selected) + 1
		const tabWidth = edge(this.selected + 1) - edge(this.selected) - 2
		g.rect(left, 1, tabWidth, height - 2).fill(UI.primary)
		g.rect(left, 1, tabWidth, height - 2).stroke({
			width: 1,
			color: UI.ink,
			alignment: 0
		})
		g.rect(left + 1, 2, tabWidth - 2, 1).fill({
			color: UI.periwinklePale,
			alpha: 0.8
		})

		this.labels.forEach((label, index) => {
			label.style.fill = index === this.selected ? UI.textOnBright : UI.textMuted
			label.alpha = index === this.hovered ? 1 : 0.9
		})
	}
}

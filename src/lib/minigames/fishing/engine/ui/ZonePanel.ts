import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { CURSORS } from '../cursors'
import { TEXT } from '../texts'
import { resetZoneTuning } from '../game/fight/zoneTuning'
import { Button } from './Button'
import { CounterPane } from './CounterPane'
import { UI } from './palette'
import { ZonePreview } from './ZonePreview'
import { ZoneSettingsPane } from './ZoneSettingsPane'
import { drawPanel, makeText, setText } from './theme'

export interface ZonePanelDeps {
	onClose(): void
	/** The previewed fish's sprite: the barracuda the preview actually fights. */
	fish: Texture
}

/** Panel geometry, in the 480×270 virtual frame. */
const PANEL = { x: 8, y: 6, width: 464, height: 258 } as const
/** The preview well on the left; the tabbed controls take the rest. */
const PREVIEW = {
	x: PANEL.x + 8,
	y: PANEL.y + 24,
	width: 210,
	height: 184
} as const
const COLUMN = {
	x: PREVIEW.x + PREVIEW.width + 10,
	y: PANEL.y + 44,
	width: 232,
	height: 208
} as const
/** Action buttons under the preview. */
const ACTIONS = {
	y: PREVIEW.y + PREVIEW.height + 6,
	width: 40,
	height: 18,
	gap: 4
} as const

type TabId = 'zones' | 'counter'

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
	{ id: 'zones', label: 'ЗОНЫ' },
	{ id: 'counter', label: 'КОНТР' }
]

const IDLE_HINT = 'НАВЕДИ НА ПОЛЗУНОК — РАССКАЖУ, ЧТО ОН МЕНЯЕТ.'

/**
 * Dev panel for the dash zone (`F8`).
 *
 * The left half runs a real fight — a barracuda with its authored script, drawn
 * with the same ring, `ZoneClock` and `drawZoneWedge` the game uses — so the
 * telegraphs, the feints, the lunge and the grab window arrive when the model
 * says they do, and a press inside the band is pressed on the model itself.
 *
 * The right half is two tabs: «ЗОНЫ» holds a fader under every number of the zone
 * (fades, delay, both durations, grey, the band's place and size, the feint's
 * edge gap, the pause between bursts, the paint), «КОНТР» holds the gesture's
 * live indicator and its three numbers. Everything is written into `zoneTuning`,
 * which both the fight's rules and its drawing read live; the values are for the
 * session only — «СБРОС» returns them to the table in the source.
 */
export class ZonePanel extends Container {
	private readonly deps: ZonePanelDeps
	private readonly preview: ZonePreview
	private readonly zones: ZoneSettingsPane
	private readonly counter: CounterPane
	private readonly tabButtons = new Map<TabId, Button>()
	private readonly help: Text
	private readonly status: Text
	private pauseButton: Button | null = null
	private open_ = false
	private tab: TabId = 'zones'
	private lastFrame = 0
	private frozen = false

	constructor(deps: ZonePanelDeps) {
		super()
		this.deps = deps
		this.visible = false

		const blocker = new Graphics()
		blocker.rect(0, 0, 480, 270).fill({ color: UI.scrim, alpha: 0.72 })
		blocker.eventMode = 'static'
		blocker.cursor = CURSORS.default
		blocker.hitArea = new Rectangle(0, 0, 480, 270)
		this.addChild(blocker)

		const panel = new Graphics()
		drawPanel(panel, PANEL.x, PANEL.y, PANEL.width, PANEL.height, {
			fill: UI.panel,
			alpha: 0.99,
			shadow: true
		})
		this.addChild(panel)

		const title = makeText('ЗОНЫ РЫВКА · DEV', {
			size: 11,
			weight: 800,
			color: UI.text,
			letterSpacing: 1
		})
		title.position.set(PANEL.x + 14, PANEL.y + 8)
		this.addChild(title)

		const hint = makeText('F8 / ESC — ЗАКРЫТЬ · ЛКМ В СЕКТОРЕ — КОНТР', {
			size: 6,
			color: UI.textMuted,
			align: 'right'
		})
		hint.anchor.set(1, 0)
		hint.position.set(PANEL.x + PANEL.width - 12, PANEL.y + 13)
		this.addChild(hint)

		this.addPreviewWell()
		this.preview = new ZonePreview(deps.fish, 1.2)
		this.preview.position.set(PREVIEW.x + PREVIEW.width / 2, PREVIEW.y + PREVIEW.height / 2)
		this.preview.setViewport(PREVIEW.width, PREVIEW.height)
		const wellMask = new Graphics()
		wellMask.rect(PREVIEW.x, PREVIEW.y, PREVIEW.width, PREVIEW.height).fill(0xffffff)
		this.addChild(wellMask)
		this.preview.mask = wellMask
		this.addChild(this.preview)

		this.zones = new ZoneSettingsPane(COLUMN.width, COLUMN.height, (message) =>
			this.setHelp(message)
		)
		this.zones.position.set(COLUMN.x, COLUMN.y)
		this.addChild(this.zones)
		this.counter = new CounterPane(COLUMN.width, COLUMN.height, (message) => this.setHelp(message))
		this.counter.position.set(COLUMN.x, COLUMN.y)
		this.counter.visible = false
		this.addChild(this.counter)

		this.buildTabs()
		this.buildActions()

		this.help = makeText(IDLE_HINT, {
			size: 6,
			color: UI.textMuted,
			wordWrapWidth: PREVIEW.width,
			lineHeight: 8
		})
		this.help.position.set(PREVIEW.x, ACTIONS.y + ACTIONS.height + 5)
		this.addChild(this.help)

		this.status = makeText('', {
			size: 6,
			color: UI.text,
			align: 'right',
			wordWrapWidth: PREVIEW.width
		})
		this.status.anchor.set(1, 0)
		this.status.position.set(PANEL.x + PANEL.width - 12, PANEL.y + 22)
		this.addChild(this.status)

		this.onRender = () => this.tick()
	}

	get isOpen(): boolean {
		return this.open_
	}

	open(): void {
		this.open_ = true
		this.visible = true
		this.lastFrame = 0
		this.setStatus('')
		this.setHelp(null)
		this.refresh()
	}

	close(): void {
		this.open_ = false
		this.visible = false
	}

	/** Show one of the two tabs. */
	setTab(id: TabId): void {
		this.tab = id
		this.zones.visible = id === 'zones'
		this.counter.visible = id === 'counter'
		for (const [tabId, button] of this.tabButtons) {
			button.setSelected(tabId === id)
		}
		this.refresh()
	}

	/** `F8` / `Escape` while open; true when the panel consumed the key. */
	handleKey(event: KeyboardEvent): boolean {
		if (!this.open_) return false
		if (event.code === 'Escape' || event.code === 'F8') {
			this.deps.onClose()
			return true
		}
		return false
	}

	/** Pull both panes from the live tuning table. */
	refresh(): void {
		this.zones.refresh()
		this.counter.refresh()
	}

	/** One frame of the preview; the counter tab redraws its indicator too. */
	private tick(): void {
		if (!this.open_) return
		const now = performance.now()
		const dt = this.lastFrame === 0 ? 0 : Math.min(0.05, (now - this.lastFrame) / 1000)
		this.lastFrame = now
		if (this.frozen) this.preview.redraw()
		else this.preview.update(dt)
		if (this.tab === 'counter') this.counter.update(this.preview.state())
	}

	/** The sunken square of water the preview sits in. */
	private addPreviewWell(): void {
		const g = new Graphics()
		g.rect(PREVIEW.x, PREVIEW.y, PREVIEW.width, PREVIEW.height).fill({
			color: UI.ink,
			alpha: 0.45
		})
		g.rect(PREVIEW.x, PREVIEW.y, PREVIEW.width, PREVIEW.height).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.4
		})
		this.addChild(g)
	}

	private buildTabs(): void {
		const width = 70
		const gap = 4
		TABS.forEach((spec, index) => {
			const button = new Button({
				label: spec.label,
				width,
				height: 16,
				size: 6,
				variant: 'secondary',
				onClick: () => this.setTab(spec.id)
			})
			button.position.set(COLUMN.x + index * (width + gap), PANEL.y + 24)
			this.addChild(button)
			this.tabButtons.set(spec.id, button)
		})
	}

	private buildActions(): void {
		const specs: ReadonlyArray<{
			label: string
			onClick: () => void
			primary?: boolean
		}> = [
			{ label: 'ПАУЗА', onClick: () => this.toggleFrozen() },
			{ label: 'НОВЫЙ БОЙ', onClick: () => this.preview.restart() },
			{
				label: TEXT.devtools.reset,
				onClick: () => {
					resetZoneTuning()
					this.refresh()
					this.setStatus(TEXT.devtools.resetDone)
				}
			},
			{ label: TEXT.devtools.close, onClick: () => this.deps.onClose() }
		]
		specs.forEach((spec, index) => {
			const button = new Button({
				label: spec.label,
				width: ACTIONS.width,
				height: ACTIONS.height,
				size: 6,
				variant: spec.primary ? 'primary' : 'secondary',
				onClick: spec.onClick
			})
			button.position.set(PREVIEW.x + index * (ACTIONS.width + ACTIONS.gap), ACTIONS.y)
			this.addChild(button)
			if (index === 0) this.pauseButton = button
		})
	}

	private toggleFrozen(): void {
		this.frozen = !this.frozen
		this.pauseButton?.setLabel(this.frozen ? 'ЖИВО' : 'ПАУЗА')
		this.setStatus('')
	}

	/** The pointer's row explained. */
	private setHelp(message: string | null): void {
		setText(this.help, message ?? IDLE_HINT)
	}

	private setStatus(message: string): void {
		setText(this.status, message)
	}
}

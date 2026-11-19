import { Container } from 'pixi.js'
import { zoneTuning } from '../game/fight/zoneTuning'
import { Button } from './Button'
import { ScrollColumn } from './ScrollColumn'
import { SliderRow } from './SliderRow'
import { ZONE_ROWS, ZONE_TEXT, type ZoneRow } from './zoneRows'
import { makeText } from './theme'

/** Room inside the scrolling column: the rows and the rim choice live here. */
const INSET = { x: 6, y: 6 } as const
const ROW_PITCH = 18
const RIM_TOP = ZONE_ROWS.length * ROW_PITCH + 6

/**
 * The «ЗОНЫ» tab: one fader under every number of the zone, and the rim's side.
 *
 * A pane of its own so the panel stays chrome: it owns its scroll column, its
 * rows and the inside/outside choice, and reports the fader under the pointer so
 * the panel can print one line of help for it.
 */
export class ZoneSettingsPane extends Container {
	private readonly scroll: ScrollColumn
	private readonly rows: Array<{
		key: ZoneRow['key']
		row: SliderRow
	}> = []
	private readonly rimButtons = new Map<boolean, Button>()

	constructor(width: number, height: number, onHelp: (message: string | null) => void) {
		super()
		this.scroll = new ScrollColumn(width, height)
		this.addChild(this.scroll)

		ZONE_ROWS.forEach((spec, index) => {
			const row = new SliderRow(
				spec,
				() => zoneTuning[spec.key],
				(value) => {
					zoneTuning[spec.key] = value
				},
				(entered) => onHelp(entered ? spec.help : null)
			)
			row.position.set(INSET.x, INSET.y + index * ROW_PITCH)
			this.scroll.content.addChild(row)
			this.rows.push({ key: spec.key, row })
		})

		const caption = makeText(ZONE_TEXT.rimSide, {
			size: 6,
			weight: 700,
			color: 0xc2cdf0
		})
		caption.position.set(INSET.x, INSET.y + RIM_TOP + 4)
		this.scroll.content.addChild(caption)

		const buttonWidth = 56
		const gap = 4
		const x = INSET.x + 72
		;(['inside', 'outside'] as const).forEach((side, index) => {
			const outside = side === 'outside'
			const button = new Button({
				label: outside ? ZONE_TEXT.rimOutside : ZONE_TEXT.rimInside,
				width: buttonWidth,
				height: 14,
				size: 6,
				variant: 'secondary',
				onClick: () => {
					zoneTuning.rimOutside = outside
					this.refresh()
				}
			})
			button.position.set(x + index * (buttonWidth + gap), INSET.y + RIM_TOP)
			this.scroll.content.addChild(button)
			this.rimButtons.set(outside, button)
		})

		this.scroll.setContentHeight(INSET.y + RIM_TOP + 22)
	}

	/** Pull every fader and both choices from the live table. */
	refresh(): void {
		for (const entry of this.rows) entry.row.setValue(zoneTuning[entry.key])
		for (const [outside, button] of this.rimButtons) {
			button.setSelected(outside === zoneTuning.rimOutside)
		}
	}
}

import { Container, Graphics, Rectangle } from 'pixi.js'
import { VIEW } from '../config'
import { CURSORS } from '../cursors'
import { UI } from './palette'

/**
 * Full-frame dimmer behind a dialog.
 *
 * Dialog windows do not bring their own scenery: the screen underneath stays
 * where it is and simply goes dark. That keeps the change readable as a panel
 * arriving over the current place instead of as a jump to a different one, and
 * the scrim also swallows clicks aimed outside the panel.
 */
export class Scrim extends Container {
	constructor(alpha = 0.72) {
		super()
		const fill = new Graphics()
		fill.rect(0, 0, VIEW.width, VIEW.height).fill({ color: UI.scrim, alpha })
		fill.eventMode = 'none'
		this.addChild(fill)
		this.eventMode = 'static'
		this.cursor = CURSORS.default
		this.hitArea = new Rectangle(0, 0, VIEW.width, VIEW.height)
	}
}

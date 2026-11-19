import { Container, type Texture } from 'pixi.js'
import { canUseFullscreen, toggleFullscreen } from '../fullscreen'
import { Button } from './Button'

/**
 * The fullscreen control, in the interface's own pixel language.
 *
 * It replaced an HTML button that sat over the canvas: a control of the game
 * belongs on the frame the game draws (it dims with the fight, uses the HUD's
 * own frame and ink, and cannot swallow the cast's presses on its way to the
 * water). One mark, not a pair: the tile is a frame opening up, and it means
 * the same thing in both states — the press toggles the mode. The old pair
 * swapped to a closing frame on entry, which read as a different button
 * appearing and needed a per-frame sync against the document.
 *
 * Only a browser with the API gets a control at all — iOS Safari has none, and
 * a button that always refuses is worse than no button (see `fullscreen.ts`).
 */
export class FullscreenToggle extends Container {
	constructor(icon: Texture, size: number, iconScale: number, hitPad = 0) {
		super()
		const button = new Button({
			width: size,
			height: size,
			variant: 'secondary',
			iconTexture: icon,
			iconScale,
			hitPad,
			onClick: () => toggleFullscreen()
		})
		this.addChild(button)
	}

	/** True when the platform can go fullscreen, so a caller knows to build one. */
	static get available(): boolean {
		return canUseFullscreen()
	}
}

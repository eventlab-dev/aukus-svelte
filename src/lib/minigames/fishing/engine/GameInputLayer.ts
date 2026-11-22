import { VIEW } from './config'
import { GameBootLayer } from './GameBootLayer'
import { CURSORS, type CursorName } from './cursors'
import { CursorOverlay } from './ui/CursorOverlay'
import { RotateNotice } from './ui/RotateNotice'
import type { CursorTextures } from './cursors'

export abstract class GameInputLayer extends GameBootLayer {
	/** True while the page hides the system pointer in favour of the overlay. */
	private nativeCursorHidden = false
	/** Portrait stub of a touch screen; built the first time the game resizes. */
	protected rotateNotice: RotateNotice | null = null
	/** Portrait state of the last resize, so the pause is asked for once. */
	private portrait = false

	protected layout(): void {
		const width = this.app.screen.width
		const height = this.app.screen.height
		const scale = Math.min(width / VIEW.width, height / VIEW.height)
		const x = Math.round((width - VIEW.width * scale) / 2)
		const y = Math.round((height - VIEW.height * scale) / 2)
		this.world.scale.set(scale)
		this.world.position.set(x, y)
		this.worldMask.scale.set(scale)
		this.worldMask.position.set(x, y)
	}

	protected applyResize(): void {
		const host = this.options.container
		const width = Math.max(1, Math.floor(host.clientWidth))
		const height = Math.max(1, Math.floor(host.clientHeight))
		if (
			Math.floor(this.app.screen.width) === width &&
			Math.floor(this.app.screen.height) === height
		) {
			this.layout()
			this.syncOrientation(width, height)
			return
		}
		this.app.renderer.resize(width, height, this.renderScale.value)
		this.layout()
		this.syncOrientation(width, height)
	}

	/**
	 * A phone held in portrait is not given a smaller game: it is asked to turn.
	 *
	 * The stub is a screen-space layer above the whole world — letterbox included
	 * — and it swallows the taps while it is up. Showing it pauses the round, the
	 * same way leaving the tab does, and turning the phone back does **not**
	 * resume: the round comes back when the player presses «продолжить», because
	 * a fight that resumes on its own drops them into a landing window they never
	 * saw open.
	 */
	private syncOrientation(width: number, height: number): void {
		if (!this.touch) return
		const portrait = height > width
		if (!this.rotateNotice) {
			const notice = new RotateNotice()
			this.rotateNotice = notice
			// Above the world and the mask, so it covers the black bars too.
			this.app.stage.addChild(notice)
		}
		this.rotateNotice.layout(width, height)
		if (portrait === this.portrait) return
		this.portrait = portrait
		this.rotateNotice.setShown(portrait)
		if (portrait) {
			this.app.canvas.classList.remove('cursor-hidden')
			this.screens.onHostPause(true)
		}
	}

	protected updateCursor(): void {
		const overlay = this.cursorOverlay
		if (!overlay) return
		if (!this.pointerInside) {
			overlay.hide()
			this.setNativeCursorHidden(false)
			return
		}

		const target = this.app.renderer.events.rootBoundary.hitTest(this.cursorX, this.cursorY)
		const token = target?.cursor
		const name: CursorName =
			token && Object.prototype.hasOwnProperty.call(CURSORS, token)
				? (token as CursorName)
				: 'default'
		overlay.setCursor(name)
		overlay.moveTo(this.cursorX, this.cursorY, this.world.scale.x * 0.5)
		this.setNativeCursorHidden(true)
	}

	protected mountCursor(cursors: CursorTextures): void {
		// A touch screen has no pointer to paint: an overlay would sit in the frame
		// corner until the first tap and then jump under the finger. The canvas
		// keeps its own pointer hidden too (see `setNativeCursorHidden`).
		if (this.touch) return
		const overlay = new CursorOverlay(cursors)
		this.cursorOverlay = overlay
		this.app.stage.addChild(overlay)
		this.updateCursor()
	}

	/**
	 * Hides the system pointer only while the game is drawing its own. It used to
	 * be hidden unconditionally from the first frame, which is why a pointer that
	 * was already sitting over the canvas showed nothing at all until it moved.
	 */
	private setNativeCursorHidden(hidden: boolean): void {
		if (this.nativeCursorHidden === hidden) return
		this.nativeCursorHidden = hidden
		this.app.canvas.classList.toggle('cursor-hidden', hidden)
	}
}

import { CURSORS } from '../../cursors'
import { CodexOverlay } from '../../ui/CodexOverlay'
import { GameScreenCore } from './GameScreenCore'

export abstract class GameOverlays extends GameScreenCore {
	protected openPause(): void {
		if (this.paused) return
		this.freezeRound()
		this.pauseMenu.open()
		// No click here: the HUD pause button is a Button and already plays one,
		// so cueing it again made every pause sound like a double press.
	}

	/**
	 * Stops the round and ducks its audio, without deciding what covers it: the
	 * pause dialog and the codex both open over a frozen frame.
	 */
	protected freezeRound(): void {
		this.paused = true
		this.resetGesture()
		this.flow.setPaused(true)
		// The round goes quiet under an overlay: a lake bed, a reel or a landed
		// chime still ringing would keep playing behind a frozen picture.
		this.game.audio.setPaused(true)
		// The flow may have cancelled the charge; clear the meter immediately
		// instead of leaving the last frame frozen behind the overlay.
		this.hud.update(0, null)
		this.castHint.visible = false
		this.inputCatcher.cursor = CURSORS.default
	}

	protected unfreezeRound(): void {
		this.paused = false
		this.flow.setPaused(false)
		this.game.audio.setPaused(false)
	}

	protected closePause(silent = false): void {
		if (!this.paused) return
		const hadCodex = this.codex !== null
		// The codex flies out over the round that is about to run again; the screen
		// drops it when the animation is over (see `updateCodex`), exactly like the
		// pause panel itself.
		this.codex?.beginClose()
		this.unfreezeRound()
		this.pauseMenu.close()
		if (!silent && !hadCodex) this.game.audio.back()
	}

	protected openCodex(): void {
		if (this.codex) return
		// The codex is modal over a frozen round. The HUD's codex button opens it
		// without the pause dialog, so the freeze happens here; from the dialog the
		// round is already frozen and only the dialog has to give up the keyboard.
		if (!this.paused) this.freezeRound()
		this.pauseMenu.blur()
		this.codex = new CodexOverlay(this.game, this.area.id, () => this.closeCodex())
		this.addChild(this.codex)
		// The control that opened it is a Button and already plays the click; a
		// second one here read as a stutter.
	}

	/** Starts the close; the overlay itself animates out from here. */
	protected closeCodex(): void {
		this.codex?.beginClose()
		// Straight from the HUD the codex is the whole overlay, so the round comes
		// back while the panel drops away. Behind the pause dialog the round stays
		// frozen — the player asked for the manual, not for the round to resume.
		if (this.paused && !this.pauseMenu.isOpen) this.unfreezeRound()
	}

	/**
	 * Ticks the codex and drops it when its fly-out has landed. It runs while the
	 * round is paused and after it resumed, so a codex closed together with the
	 * pause menu still finishes its slide instead of vanishing.
	 */
	protected updateCodex(dt: number): void {
		const codex = this.codex
		if (!codex) return
		if (!codex.update(dt)) return
		codex.destroy({ children: true })
		this.codex = null
		// A dialog may still be standing behind the codex: hand the keyboard back
		// to its first entry, «продолжить». A codex opened from the HUD leaves no
		// dialog to return to.
		if (this.pauseMenu.isOpen) this.pauseMenu.focusAt(0)
	}
}

import { Container } from 'pixi.js'

export abstract class Screen extends Container {
	/**
	 * True for full-screen panels that open *over* another screen (picker, codex,
	 * help): they fly in from the bottom instead of fading the whole frame.
	 */
	readonly popup: boolean = false
	/**
	 * A popup that animates its own chrome (a static dimmer plus a panel that
	 * flies in). The screen manager then leaves the screen itself in place instead
	 * of sliding the dimming along with the panel.
	 */
	readonly selfFlown: boolean = false
	onEnter(): void {}
	onExit(): void {}
	update(_dt: number): void {}
	/**
	 * Optional exit animation for a popup. When a screen defines this, the screen
	 * manager stops sliding the whole screen — dimmer included — and lets the
	 * screen animate its own chrome in place. It is called for the duration of the
	 * manager's fly, then the screen is destroyed as usual.
	 */
	animateOut?(_dt: number): void
	handleKey(_event: KeyboardEvent): boolean {
		return false
	}
	handleKeyUp(_event: KeyboardEvent): void {}
	handleWheel(_event: WheelEvent): boolean {
		return false
	}
	onHostPause(_paused: boolean): void {}
	onMuteChanged(): void {}
	/**
	 * The dev audio panel opened or closed over this screen. The panel has to
	 * hear the faders it is tuning, so a screen that ducks its own audio lifts
	 * that duck while the panel is up.
	 */
	onAudioPanel(_open: boolean): void {}
}

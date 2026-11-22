/**
 * Fullscreen, as the game itself uses it.
 *
 * The route used to carry an HTML button over the canvas, and the browser's
 * fullscreen state lived there. It lives here now: the control is part of the
 * game's HUD (drawn in the same pixel language as the codex and the pause, on
 * the frame the player is already looking at), so the state it toggles cannot
 * be owned by a different layer than the button.
 *
 * Two things are still the platform's, not ours:
 *
 * - **The gesture.** `requestFullscreen` is only granted from a real input
 *   event, so every entry point calls {@link enterFullscreen} synchronously from
 *   its own handler: the boot gate's tap (the first gesture of the session) and
 *   the HUD button's click.
 * - **The feature test.** iOS Safari has no fullscreen API for an arbitrary
 *   element; there the calls are no-ops and the HUD button is never built (see
 *   `GameScreenCore`), which leaves "Добавить на экран Домой" — the manifest is
 *   already `display: standalone` — as the only way out of the address bar.
 */

/** True when this browser can put the page in fullscreen at all. */
export function canUseFullscreen(): boolean {
	return (
		typeof document !== 'undefined' &&
		typeof document.documentElement.requestFullscreen === 'function'
	)
}

/** True while the page is in fullscreen. */
export function isFullscreen(): boolean {
	return typeof document !== 'undefined' && document.fullscreenElement !== null
}

/**
 * Asks for fullscreen. Must be called from an input handler, or the browser
 * refuses; a refusal (policy, an iframe without `allowfullscreen`) is not an
 * error — the game simply stays in its tab.
 */
export function enterFullscreen(): void {
	if (!canUseFullscreen() || isFullscreen()) return
	void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
}

/** Leaves fullscreen, if the page is in it. */
export function exitFullscreen(): void {
	if (!isFullscreen()) return
	void document.exitFullscreen().catch(() => {})
}

/** What the HUD button does. */
export function toggleFullscreen(): void {
	if (isFullscreen()) exitFullscreen()
	else enterFullscreen()
}

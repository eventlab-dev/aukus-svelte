/**
 * Cap on the renderer's pixel ratio.
 *
 * One on a phone, two on a desktop. The phone number is not a preference: at 2×
 * the same fight ran at ~30 fps on the handsets it was played on, which is not a
 * fight, and the phone's own panel is small enough that the 480×270 frame at 1×
 * still lands on whole pixels — the art is the pixels. A desktop keeps the
 * sharper cap, because there the cost of the pixels is not the frame.
 *
 * `?dpr=1.5` (or any value from 0.75 to 2) overrides the cap so the cost of the
 * pixels can be measured on the device itself — same scene, same input, one
 * number changed.
 */
export function pixelRatioCap(touch = false): number {
	const fallback = touch ? 1 : 2
	if (typeof window === 'undefined') return fallback
	const raw = Number(new URLSearchParams(window.location.search).get('dpr'))
	if (!Number.isFinite(raw) || raw <= 0) return fallback
	return Math.min(2, Math.max(0.75, raw))
}

/**
 * Which input the session is built for.
 *
 * `touch` is a phone or a tablet held in the hand: coarse pointer, no painted
 * cursor, big targets. `mouse` is everything else — a desktop, a laptop
 * trackpad, a tablet with a stylus — and keeps the pixel cursor and the
 * desktop sizes it always had.
 */
export type InputProfile = 'touch' | 'mouse'

/**
 * The media query is the whole test, not a user-agent sniff: a hybrid tablet
 * with a keyboard reports a fine pointer while its fingers are on the glass,
 * and the game is played with a finger.
 *
 * In development `?touch=1` / `?touch=0` forces the profile, so the phone
 * layout can be played in a desktop browser (and the desktop one checked on a
 * phone) without a build.
 */
export function detectInputProfile(): InputProfile {
	if (typeof window === 'undefined') return 'mouse'
	if (import.meta.env.DEV) {
		const forced = new URLSearchParams(window.location.search).get('touch')
		if (forced === '1') return 'touch'
		if (forced === '0') return 'mouse'
	}
	return window.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'mouse'
}

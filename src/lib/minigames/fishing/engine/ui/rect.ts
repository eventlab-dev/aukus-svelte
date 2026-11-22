/**
 * Rectangles in scene pixels, and the two questions the interface asks of them.
 *
 * The tutorial note is placed around the fight and around the round's own
 * controls, and both of those are boxes: the note has to know whether it would
 * cover one, and how much air is left between it and the fight. The arithmetic
 * lives here so the note reads as a placement rule and not as geometry.
 */
export interface UiRect {
	x: number
	y: number
	width: number
	height: number
}

/** True when the two rectangles share a pixel. */
export function rectsOverlap(a: UiRect, b: UiRect): boolean {
	return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/** Air between two rectangles in pixels; 0 when they overlap. */
export function rectGap(a: UiRect, b: UiRect): number {
	const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0)
	const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0)
	return Math.hypot(dx, dy)
}

/** True when the point lies inside the rectangle, its own edges included. */
export function rectHoldsPoint(rect: UiRect, x: number, y: number): boolean {
	return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

/** Air between a point and the rectangle's nearest edge in pixels; 0 inside. */
export function rectPointGap(rect: UiRect, x: number, y: number): number {
	const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.width))
	const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.height))
	return Math.hypot(dx, dy)
}

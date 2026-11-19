import type { SceneLayout } from '../areas'
import { clamp } from '../utils'
import { castAway, castBand, ringClearsAngler, type CastBounds } from './castSafety'

/**
 * Aiming the cast at the cursor.
 *
 * The float used to fall at a random spot inside the water band, with power
 * choosing how far up or across it went: the player pointed the rod nowhere in
 * particular and the cast went where the water let it. Now the cursor is the
 * direction and the power is the distance along it — the float lands on the ray
 * from the rod tip through the pointer, inside the area's band, so the aim is a
 * real input and a miss is the player's, not the dice's.
 */

/** Closer than this to the rod tip, the pointer gives no usable direction. */
const MIN_AIM = 6
/** Guard for a ray exactly parallel to one of the band's sides. */
const PARALLEL = 1e-6
/** Below this span the ray misses the band and the cast clamps into it. */
const NO_SPAN = 1e-3

export interface CastAimInput {
	/** Rod tip: where the float leaves the hand. */
	from: { x: number; y: number }
	/** Cursor, in the same virtual units. */
	aim: { x: number; y: number }
	/** Area layout: the band the float has to land in, and the angler. */
	layout: SceneLayout
	/** 0..1 cast power: how far along the aim the float lands. */
	power: number
}

export interface CastAim {
	x: number
	y: number
	/** Unit direction from the angler to the landing spot, for `safeCastSpot`. */
	away: { x: number; y: number }
}

/** Distances along a ray at which it is inside a box, or null when it misses. */
function rayBand(
	from: { x: number; y: number },
	dirX: number,
	dirY: number,
	band: CastBounds
): { near: number; far: number } | null {
	let near = -Infinity
	let far = Infinity
	const axes = [
		{ origin: from.x, direction: dirX, min: band.minX, max: band.maxX },
		{ origin: from.y, direction: dirY, min: band.minY, max: band.maxY }
	]
	for (const axis of axes) {
		if (Math.abs(axis.direction) < PARALLEL) {
			// The ray never crosses this pair of sides: it misses unless it already
			// sits between them.
			if (axis.origin < axis.min || axis.origin > axis.max) return null
			continue
		}
		const first = (axis.min - axis.origin) / axis.direction
		const second = (axis.max - axis.origin) / axis.direction
		near = Math.max(near, Math.min(first, second))
		far = Math.min(far, Math.max(first, second))
	}
	if (far - near < NO_SPAN) return null
	// A band behind the rod tip is not a cast: nothing to aim at.
	if (far <= 0) return null
	return { near: Math.max(0, near), far }
}

/**
 * Landing spot for a cast aimed at the cursor: the point at `power` along the
 * ray from the rod tip through the pointer, kept inside the area's band.
 *
 * The power only walks the part of the ray that the fight ring can actually use
 * — a spot so close to the angler that the ring would cover him is not a cast
 * the player can read, and mapping power onto it would spend half the bar on
 * spots the safety search immediately pushes away.
 *
 * A pointer that points away from the water still gets a cast — the aim is
 * clamped into the band — so the input can never strand the round without a
 * float in the water.
 */
export function aimCast({ from, aim, layout, power }: CastAimInput): CastAim {
	// The band the ring can be played in, not the authored one: a ray that runs
	// into the sky rail's strip would spend its power on water the float can
	// never be dropped on.
	const band = castBand(layout)
	const fallback = castAway(layout)
	const dx = aim.x - from.x
	const dy = aim.y - from.y
	const length = Math.hypot(dx, dy)
	const dirX = length >= MIN_AIM ? dx / length : fallback.x
	const dirY = length >= MIN_AIM ? dy / length : fallback.y

	const span = rayBand(from, dirX, dirY, band)
	let x: number
	let y: number
	if (span) {
		const usable = clearSpan(from, dirX, dirY, span, layout.angler)
		// Power walks the float from the near side of the band to the far one, so
		// the whole reachable water is on the same aim line.
		const travel = usable.near + (usable.far - usable.near) * clamp(power)
		x = from.x + dirX * travel
		y = from.y + dirY * travel
	} else {
		x = clamp(aim.x, band.minX, band.maxX)
		y = clamp(aim.y, band.minY, band.maxY)
		const clear = clearAim(x, y, layout)
		x = clear.x
		y = clear.y
	}

	const toX = x - layout.angler.x
	const toY = y - layout.angler.y
	const distance = Math.hypot(toX, toY)
	const away = distance > 0.001 ? { x: toX / distance, y: toY / distance } : fallback
	return { x, y, away }
}

/**
 * Pushes a spot that landed too close to the angler further out along the band,
 * so a pointer aimed at the bank still gives a cast the ring can sit on. The
 * walk stops at the band's edge: the areas' bands always hold a clear spot, and
 * the safety search is still the last word if one does not.
 */
function clearAim(x: number, y: number, layout: SceneLayout): { x: number; y: number } {
	if (ringClearsAngler(x, y, layout.angler)) return { x, y }
	const band = castBand(layout)
	const dx = x - layout.angler.x
	const dy = y - layout.angler.y
	const distance = Math.hypot(dx, dy)
	if (distance < 0.001) return { x, y }
	const stepX = dx / distance
	const stepY = dy / distance
	let lastX = x
	let lastY = y
	for (let step = 2; step <= 400; step += 2) {
		const nextX = clamp(x + stepX * step, band.minX, band.maxX)
		const nextY = clamp(y + stepY * step, band.minY, band.maxY)
		if (nextX === lastX && nextY === lastY) break
		if (ringClearsAngler(nextX, nextY, layout.angler)) {
			return { x: nextX, y: nextY }
		}
		lastX = nextX
		lastY = nextY
	}
	return { x, y }
}

/**
 * Trims a span of the ray to the part where the fight ring clears the angler.
 * A ray that has no such part at all keeps the span it came with: the safety
 * search is still the last word on where the float can sit.
 */
function clearSpan(
	from: { x: number; y: number },
	dirX: number,
	dirY: number,
	span: { near: number; far: number },
	angler: { x: number; y: number }
): { near: number; far: number } {
	const length = span.far - span.near
	if (length <= 0) return span
	const steps = Math.max(1, Math.ceil(length))
	let near = span.near
	let far = span.near
	let found = false
	for (let index = 0; index <= steps; index += 1) {
		const travel = span.near + (length * index) / steps
		const clear = ringClearsAngler(from.x + dirX * travel, from.y + dirY * travel, angler)
		if (!clear) continue
		if (!found) {
			near = travel
			found = true
		}
		far = travel
	}
	return found ? { near, far } : span
}

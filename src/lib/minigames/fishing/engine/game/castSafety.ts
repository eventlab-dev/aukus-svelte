import type { SceneLayout } from '../areas'
import { VIEW } from '../config'
import { RAIL_HEIGHT } from '../ui/weatherRailLayout'
import { FIGHT_RADIUS } from './fight'

/**
 * Keeping the ring off the bank and off the angler.
 *
 * The float lands somewhere in the water and the whole ring-fight is built
 * around that point, so the landing spot has to leave room for the ring. A cast
 * that lands on the shore — or right under the rod tip — puts half the zone the
 * player has to hold the fish inside onto snow, where the fish silhouette is
 * unreadable and the "keep it in the circle" rule stops making sense.
 *
 * The area layouts in `areas.ts` are authored so that even the shortest cast
 * clears both, and {@link safeCastSpot} is the runtime guarantee behind that:
 * it walks the landing point along the cast direction until the ring is clear,
 * so a later edit to a band can never produce an unplayable zone.
 */

/** Same radius the fight model builds its circle with. */
export const RING_RADIUS = FIGHT_RADIUS
/** Rim wave amplitude plus the entrance pop: how far the ring art spills out. */
export const RING_PAD = 5
/**
 * The angler is a 32×32 sheet frame, but the ink inside it is much smaller:
 * roughly 19 px wide and 16 px tall, sitting above the point his feet touch.
 */
export const ANGLER_RADIUS = 22
/** Vertical offset of the angler's ink from his feet. */
export const ANGLER_LIFT = 12
/** Minimum gap between the ring centre and the angler's art. */
export const ANGLER_CLEARANCE = RING_RADIUS + RING_PAD + ANGLER_RADIUS
/** Inset of the sky rail from the frame's bottom edge (`WeatherForecast`). */
const RAIL_INSET = 8
/** Air kept between the ring's rim and the rail's frame. */
const RAIL_AIR = 2
/**
 * Lowest float centre the fight ring can sit on without reaching the sky rail.
 *
 * The rail is the one piece of the interface that stays on the frame for the
 * whole round — the corner cards and the forecast step aside for the fight, the
 * rail is dimmed but present — and it owns the bottom strip of the lake. A cast
 * that landed under it put half the ring, the fish silhouette and the escape
 * are behind the panel: a zone the player cannot read. The clamp is on the ring
 * rather than on the float, because it is the ring that has to stay visible.
 */
export const RING_SAFE_MAX_Y =
	VIEW.height - RAIL_INSET - RAIL_HEIGHT - (RING_RADIUS + RING_PAD) - RAIL_AIR
/** Step and reach of the search that pushes a landing spot off the bank. */
const SEARCH_STEP = 2
const SEARCH_STEPS = 48
/** Water samples taken around the ring; 28 points is one every ~7 px. */
const RING_SAMPLES = 28

export interface CastSpot {
	x: number
	y: number
}

export interface CastBounds {
	minX: number
	maxX: number
	minY: number
	maxY: number
}

export interface SafeCastOptions {
	/** Landing point the aim and the cast power produced. */
	point: CastSpot
	/** Open-water test of the area renderer. */
	isWater: (x: number, y: number) => boolean
	/** Where the angler stands (his feet, not his art). */
	angler: CastSpot
	/** Unit direction the cast travels away from the angler. */
	away: CastSpot
	/** Band the landing point must stay inside. */
	bounds: CastBounds
}

export interface CastSpotResult extends CastSpot {
	/**
	 * Pixels the landing point had to be moved — away from the angler, or up out
	 * of the rail's strip. Zero when the aim was already playable.
	 */
	moved: number
	/** False when no spot inside the band cleared the ring. */
	safe: boolean
}

/** Centre of the angler's art, which is what the ring must not touch. */
export function anglerInkCentre(angler: CastSpot): CastSpot {
	return { x: angler.x, y: angler.y - ANGLER_LIFT }
}

/** True when no part of the ring reaches the angler. */
export function ringClearsAngler(x: number, y: number, angler: CastSpot): boolean {
	const centre = anglerInkCentre(angler)
	return Math.hypot(x - centre.x, y - centre.y) >= ANGLER_CLEARANCE
}

/** True when the whole rim sits on open water rather than on a bank or pier. */
export function ringClearsWater(
	isWater: (x: number, y: number) => boolean,
	x: number,
	y: number,
	samples = RING_SAMPLES
): boolean {
	if (!isWater(x, y)) return false
	const radius = RING_RADIUS + RING_PAD
	for (let i = 0; i < samples; i += 1) {
		const angle = (i / samples) * Math.PI * 2
		if (!isWater(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)) {
			return false
		}
	}
	return true
}

/** Everything a landing spot has to satisfy. */
export function isCastSpotSafe(
	isWater: (x: number, y: number) => boolean,
	angler: CastSpot,
	x: number,
	y: number
): boolean {
	return ringClearsAngler(x, y, angler) && ringClearsWater(isWater, x, y)
}

/** Fallback cast direction away from the angler, per bobber axis. */
export function castAway(layout: SceneLayout): CastSpot {
	return layout.bobber.axis === 'y' ? { x: 0, y: -1 } : { x: 1, y: 0 }
}

/** Band of a layout, in the shape {@link safeCastSpot} expects. */
export function layoutBounds(layout: SceneLayout): CastBounds {
	const zone = layout.bobber
	return {
		minX: zone.minX,
		maxX: zone.maxX,
		minY: zone.minY,
		maxY: zone.maxY
	}
}

/**
 * Band a cast may actually land in: the authored one, clipped above the sky
 * rail. Aim previews, the touch picker and the safety search all read this, so
 * no path can put the ring under the panel.
 */
export function castBand(layout: SceneLayout): CastBounds {
	const bounds = layoutBounds(layout)
	return { ...bounds, maxY: Math.min(bounds.maxY, RING_SAFE_MAX_Y) }
}

/**
 * Pushes a landing point along the cast until the whole ring clears the bank
 * and the angler. Points that are already fine are returned untouched, so the
 * authored bands stay the real source of the cast feel; the search only fires
 * when an aim or a band edit would break the zone.
 */
export function safeCastSpot(options: SafeCastOptions): CastSpotResult {
	const { point, isWater, angler, away, bounds } = options
	// The frame's own limit, whatever band the caller passed: the ring must stay
	// off the sky rail even if an area edit widened its water past it.
	const minY = bounds.minY
	const maxY = Math.min(bounds.maxY, RING_SAFE_MAX_Y)
	const clampX = (value: number): number => Math.min(bounds.maxX, Math.max(bounds.minX, value))
	const clampY = (value: number): number => Math.min(maxY, Math.max(minY, value))

	const start = { x: clampX(point.x), y: clampY(point.y) }
	if (isCastSpotSafe(isWater, angler, start.x, start.y)) {
		const moved = Math.hypot(start.x - point.x, start.y - point.y)
		return { x: start.x, y: start.y, moved, safe: true }
	}

	// The furthest in-water point seen on the way out: if nothing clears the
	// ring, this is still the least-bad place to drop the float.
	let fallback: CastSpot = { x: start.x, y: start.y }
	let fallbackDistance = -Infinity

	for (let step = SEARCH_STEP; step <= SEARCH_STEP * SEARCH_STEPS; step += SEARCH_STEP) {
		const x = clampX(start.x + away.x * step)
		const y = clampY(start.y + away.y * step)
		if (!isWater(x, y)) break
		if (isCastSpotSafe(isWater, angler, x, y)) {
			return { x, y, moved: step, safe: true }
		}
		const distance = Math.hypot(x - angler.x, y - angler.y)
		if (distance > fallbackDistance) {
			fallback = { x, y }
			fallbackDistance = distance
		}
	}

	return { x: fallback.x, y: fallback.y, moved: 0, safe: false }
}

import { FIGHT } from '../../config'
/**
 * The numbers behind the dash zone, in one editable table.
 *
 * The zone is a feel, and a feel can only be judged while it moves, so these
 * live here instead of as `const`s in the rules: the dev panel (`F8`) turns them
 * while the fight runs. The model *and* the view read this object every frame,
 * so a slider changes both the picture and what the fight accepts — the
 * highlight and the rule cannot drift apart.
 *
 * Nothing is persisted by the game: the panel's numbers live until a reload, so
 * a tuned set is copied into this file by hand and becomes the shipped default.
 */
export interface ZoneTuning {
	/** Seconds for the zone to fade in when it appears; 0 is an instant cut. */
	fadeIn: number
	/** Seconds for it to fade out once the dash is over. */
	fadeOut: number
	/** Seconds before the real zone of a feint appears, after the false one. */
	delay: number
	/**
	 * How long the real zone stays on screen, in seconds. The counter is open for
	 * exactly this long: a press inside the band is a grab for as long as the band
	 * is painted, and the ant never has to guess when a shorter window opens.
	 */
	truthTime: number
	/** How long the false zone of a feint stays on screen, in seconds. */
	lieTime: number
	/** Seconds for a zone that was countered to drain to the blocked grey. */
	greyTime: number
	/** Half-angle of the grab wedge, in degrees. */
	grabArc: number
	/** Inner radius of the wedge band, in pixels from the centre of the ring. */
	distance: number
	/** Depth of the band, in pixels, from `distance` outwards. */
	grabDepth: number
	/**
	 * Smallest and largest gap between the *edges* of the false and the real zone
	 * of a feint, in degrees: the angle between the two headings is this plus the
	 * two half-angles, so a gap of 0 means the zones touch.
	 */
	spreadMin: number
	spreadMax: number
	/** Minimum quiet time between two dashes, in seconds. */
	dashGap: number
	/** Fill and rim opacity, 0..1. */
	fill: number
	rim: number
	/** Rim thickness, in pixels. */
	rimWidth: number
	/** Draw the rim outside the zone's edge instead of inside it. */
	rimOutside: boolean
	/** How far the drag has to travel toward the centre before the grab counts, in pixels. */
	counterDrag: number
	/** Seconds of rest through the telegraph that arm the grab without a fresh press. */
	counterRest: number
	/** Seconds the fish hangs stunned after a landed counter. */
	counterStun: number
	/**
	 * The padlock that seals a landed counter: how long it stays lit, how big it
	 * is, how high it rides above its anchor and whether it hangs on the float
	 * (where the player is already looking) or on the fish.
	 */
	lockTime: number
	lockScale: number
	lockLift: number
	lockAtFloat: boolean
	/**
	 * The counter's receipt ring, drawn around the float: the radius it starts at
	 * and how far it runs out while the stun lasts.
	 */
	cueSize: number
	cueGrow: number
}

export const ZONE_DEFAULTS: ZoneTuning = {
	fadeIn: 0.15,
	fadeOut: 0.3,
	delay: 0.3,
	truthTime: 0.7,
	lieTime: 0.5,
	greyTime: 0.15,
	grabArc: 18.0,
	distance: 30.0,
	grabDepth: 20.0,
	spreadMin: 10.0,
	spreadMax: 30.0,
	dashGap: 0.7,
	fill: 0.16,
	rim: 0.5,
	rimWidth: 1.0,
	rimOutside: false,
	counterDrag: FIGHT.counterDrag,
	counterRest: FIGHT.counterRest,
	counterStun: FIGHT.counterStun,
	lockTime: 0.35,
	lockScale: 1,
	lockLift: -4,
	lockAtFloat: true,
	cueSize: 12,
	cueGrow: 12
}

/**
 * The same table for a finger.
 *
 * A fingertip covers a far bigger patch of the ring than a cursor and cannot be
 * placed as precisely, so the wedge is wider and starts closer to the edge: the
 * gesture is «press the sector and pull», and a sector you cannot hit is a
 * counter you cannot perform. The drag is shorter for the same reason — the
 * hand overshoots a longer pull.
 *
 * Only the geometry of the gesture changes. The window (`truthTime`), the price
 * of a miss and the escape-meter recovery stay exactly as they are on desktop,
 * so the balance of a fight is the same game on both.
 */
export const ZONE_TOUCH_DEFAULTS: ZoneTuning = {
	...ZONE_DEFAULTS,
	grabArc: 24.0,
	distance: 28.0,
	grabDepth: 28.0,
	counterDrag: 8
}

/** Which table is live: the one the mouse is played with, or the finger's. */
export type ZoneProfile = 'mouse' | 'touch'

/**
 * Extra angular slack for the touch answer to a dash, in radians.
 *
 * A mouse puts its press *inside* the wedge, which is a precise thing to do
 * with a cursor; a thumb on a small pad cannot be that precise. The control and
 * the rules read this one number, so the sector the pad lights up and the sector
 * the model accepts cannot drift apart.
 */
export const STICK_GRAB_SLACK = Math.PI / 6

let activeProfile: ZoneProfile = 'mouse'

/** Live values: the panel writes, the fight reads. */
export const zoneTuning: ZoneTuning = { ...ZONE_DEFAULTS }

/** Installs a profile's numbers into the live table. */
export function applyZoneProfile(profile: ZoneProfile): void {
	activeProfile = profile
	Object.assign(zoneTuning, profile === 'touch' ? ZONE_TOUCH_DEFAULTS : ZONE_DEFAULTS)
}

/** True when the touch table is the live one. */
export function zoneProfile(): ZoneProfile {
	return activeProfile
}

/**
 * Drops the live table back to the defaults of the *active* profile, so the
 * panel's «СБРОС» on a phone does not hand the player desktop geometry.
 */
export function resetZoneTuning(): void {
	Object.assign(zoneTuning, activeProfile === 'touch' ? ZONE_TOUCH_DEFAULTS : ZONE_DEFAULTS)
}

/** Degrees to radians, for the angular knobs. */
export function zoneRadians(degrees: number): number {
	return (degrees * Math.PI) / 180
}

/** Inner radius of the grab band, in pixels. */
export function zoneInner(): number {
	return zoneTuning.distance
}

/** Outer radius of the grab band, in pixels. */
export function zoneOuter(): number {
	return zoneTuning.distance + zoneTuning.grabDepth
}

/** Half-angle of the grab band, in radians. */
export function zoneArc(): number {
	return zoneRadians(zoneTuning.grabArc)
}

/**
 * Angular offset of a feint's false heading from the real one, in radians: the
 * panel's edge gap plus the two half-angles that separate the headings themselves.
 */
export function zoneFeintOffset(gapDegrees: number): number {
	return zoneRadians(gapDegrees) + zoneArc() * 2
}

export const FISH_SCALE = 1
/**
 * The hooked fish is never shown in its own colours: through the water it is a
 * shadow, and the fight is about reading its motion, not its livery. The tint is
 * almost black rather than the old blue-teal, and the sprite sits below full
 * opacity so it stays a dark shape *in* the water instead of a sticker on top of
 * it — the red float and the warning arrow must remain the brightest things in
 * the ring.
 */
export const SILHOUETTE = 0x05080b
/** The warning only lifts the shadow to a cold slate; the arrow carries the cue. */
export const SILHOUETTE_WARN = 0x1b2830
/**
 * The tone of a blocked jerk: the dash cone drains to it and the fish's shadow
 * lifts to it, so "this jerk is cancelled" is one colour wherever it shows —
 * the cone, the shadow and the padlock all read as the same receipt.
 */
export const COUNTER_TONE = 0x5d7f92
/**
 * The countered fish: the same shadow, lifted towards the ice of the lock that
 * sits on it. The whole "this jerk is cancelled" marker is the fish plus the
 * padlock, so the fish takes the cue's colour instead of wearing a ring.
 */
export const SILHOUETTE_COUNTER = COUNTER_TONE
/** Opacity of that shadow; low enough that the water reads through the fish. */
export const SILHOUETTE_ALPHA = 0.55
export const TAU = Math.PI * 2
export const INTRO_DURATION = 0.42
/**
 * Geometry of the grip gauge, in scene pixels. It lives here because two views
 * need it: the bar draws itself from it, and the stage places the captions that
 * belong to the scale (the «нет сил» caption rises out of its centre).
 */
export const GAUGE = { width: 74, height: 9 } as const
/**
 * The landing window is announced by a ring that closes onto the tired fish.
 *
 * It used to be a gold "!" over the float, then a blinking fish, then nothing
 * at all — the chime and the spray alone were too easy to miss in a fight with
 * a heading arrow and two gauges on screen. The ring reuses the language the
 * player already knows from the fight circle and needs no new object: it
 * shrinks onto the fish over {@link LAND_RING_CLOSE} seconds, holds while the
 * window stays open, and opens back up when the chance is gone.
 */
export const LAND_RING_CLOSE = 0.35
/**
 * The closing ring around the float. It opens wider than the float's waterline
 * and the direction pointer (which orbits at 12 px), so it frames them on the
 * way in, and closes all the way down to the float itself — the ring ends up
 * hugging the float's own 5×8 body.
 */
export const LAND_RING_OUTER = 22
export const LAND_RING_INNER = 5

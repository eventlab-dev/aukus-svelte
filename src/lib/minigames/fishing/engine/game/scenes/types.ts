import type { Container, Graphics } from 'pixi.js'
import type { SceneLayout } from '../../areas'

/**
 * An area renderer draws everything that makes a water body recognizable.
 * Fishing mechanics, the angler, line, bobber and particles live in the
 * shared `FishingScene`; this seam only paints the world.
 */
export interface SceneRenderer {
	readonly layout: SceneLayout
	/** Static water, shore, far bank and ice. */
	drawWorld(g: Graphics): void
	/**
	 * Trunks lying in the water. They get their own layer between the painted
	 * world and the water motion, so the surface runs over them and they can be
	 * rocked in {@link animate} without being repainted every frame.
	 */
	drawFloating?(layer: Container): void
	/** Trees, rocks, dock/raft, light fixture and other z-sorted props. */
	drawScenery(props: Container): void
	/**
	 * Per-frame water motion drawn above the static world. Cloud shadows are not
	 * part of it: they are a scene-wide layer above the props.
	 */
	drawMotion(g: Graphics, time: number): void
	/**
	 * Textured water. The scene hands the renderer a layer of its own between the
	 * painted world and {@link drawMotion}, so tiled caustics can live under the
	 * crests without being repainted with them. Optional: a renderer that paints
	 * its water flat simply does not implement it, and the layer stays empty.
	 */
	attachWater?(layer: Container): void
	/** Per-frame tick for whatever {@link attachWater} put on that layer. */
	updateWater?(time: number): void
	/**
	 * Optional per-frame animation of props the renderer owns, such as a boat
	 * rocking on the swell or a trunk riding the chop. Called after
	 * {@link drawMotion}.
	 */
	animate?(time: number): void
	/** True when the point is open water the bobber/cursor may use. */
	isWater(x: number, y: number): boolean
}

import type { PixelWater } from '../game/scenes/pixelWater'
import { liveWaterLayer } from '../game/scenes/pixelWater'
import type { WaterLook } from '../game/scenes/waterLook'

/**
 * The water knobs the F3 inspector can turn.
 *
 * Kept out of the panel because they are a table, not a drawing: each row reads
 * one number off the live layer, writes it back and knows how to print it. The
 * panel only owns the chrome.
 *
 * Colours and the foam speck set are baked into textures when a scene is built,
 * so they are not here: a control that silently did nothing until the next area
 * switch would be worse than no control at all.
 */
export interface WaterRowSpec {
	/** Caption in the gutter. */
	label: string
	/** One click moves the value by this much. */
	step: number
	min: number
	max: number
	/** Current value, read from the live layer. */
	read(look: WaterLook, speed: number): number
	/**
	 * Applies a value. `baseline` is the look as the panel opened, which is what
	 * a row needs when one click has to move two numbers together.
	 */
	write(look: WaterLook, value: number, baseline: WaterLook | null): void
	/** Value as shown: percentages and multipliers read better than raw floats. */
	format(value: number): string
	/** True for the row that scales the layer's clock instead of its look. */
	clock?: boolean
}

/** Clamp to a row's range and kill the float dust a stepper accumulates. */
function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

export const WATER_ROWS: readonly WaterRowSpec[] = [
	{
		label: 'ВОЛНА',
		read: (look) => look.farScale,
		write: (look, value) => {
			look.farScale = value
		},
		step: 1,
		min: 1,
		max: 6,
		format: (value) => `${value}×`
	},
	{
		label: 'КАУСТИКА',
		read: (look) => look.farAlpha,
		write: (look, value, baseline) => {
			// Both nets answer one knob: they are the same light at two scales, and
			// tuning them apart was never the interesting part. The ratio is the one
			// the area asks for, so a lake stays dimmer than a bay at every setting.
			const near = baseline?.nearAlpha ?? look.nearAlpha
			const far = baseline?.farAlpha ?? look.farAlpha
			const ratio = far > 0 ? near / far : 0.8
			look.farAlpha = value
			look.nearAlpha = clamp(value * ratio, 0, 1)
		},
		step: 0.02,
		min: 0,
		max: 0.6,
		format: (value) => `${Math.round(value * 1000) / 10}%`
	},
	{
		label: 'СКОРОСТЬ',
		clock: true,
		read: (_look, speed) => speed,
		write: () => {
			// Written straight onto the layer: the speed is not part of the look, it
			// scales the clock the whole surface runs on.
		},
		step: 0.25,
		min: 0,
		max: 3,
		format: (value) => `${value.toFixed(2)}×`
	},
	{
		label: 'ПЕНА',
		read: (look) => look.foamAlpha,
		write: (look, value) => {
			look.foamAlpha = value
		},
		step: 0.1,
		min: 0,
		max: 1,
		format: (value) => `${Math.round(value * 100)}%`
	},
	{
		label: 'БЛЕСК',
		read: (look) => look.glitterAlpha,
		write: (look, value) => {
			look.glitterAlpha = value
		},
		step: 0.1,
		min: 0,
		max: 1.5,
		format: (value) => `${Math.round(value * 100)}%`
	},
	{
		label: 'ДЫХАНИЕ',
		read: (look) => look.breathAlpha,
		write: (look, value) => {
			look.breathAlpha = value
		},
		step: 0.02,
		min: 0,
		max: 0.4,
		format: (value) => `${Math.round(value * 100)}%`
	}
]

/** One click on `-` or `+`: move the row's value and apply it live. */
export function nudgeWater(index: number, direction: number, baseline: WaterLook | null): void {
	const spec = WATER_ROWS[index]
	const layer: PixelWater | null = liveWaterLayer()
	if (!spec || !layer) return
	const current = spec.read(layer.look, layer.speed)
	const next = clamp(current + spec.step * direction, spec.min, spec.max)
	if (next === current) return
	if (spec.clock) layer.speed = next
	else spec.write(layer.look, next, baseline)
}

/** Puts every water number back where the panel found it. */
export function resetWater(baseline: WaterLook | null): void {
	const layer = liveWaterLayer()
	if (baseline && layer) Object.assign(layer.look, baseline)
	if (layer) layer.speed = 1
}

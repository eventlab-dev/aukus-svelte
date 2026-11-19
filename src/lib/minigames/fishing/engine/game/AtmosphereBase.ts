import { Container, Graphics } from 'pixi.js'
import type { AreaMood } from '../areas'
import { VIEW } from '../config'
import { WEATHER, WINTER, type WeatherDef, type WorldPalette } from '../world'
import { randRange } from '../utils'
import { FogLayer } from './fog'

interface Flake {
	x: number
	y: number
	size: number
	speed: number
	drift: number
	phase: number
	/** How much the wind pushes this flake, so the sheet never moves as a block. */
	wind: number
}

interface Splash {
	x: number
	y: number
	life: number
	maxLife: number
}

const DAY: WorldPalette = {
	tint: 0xf3f9ff,
	overlay: 0xffffff,
	overlayAlpha: 0,
	lantern: 0,
	water: WINTER.waterDeep,
	deep: WINTER.waterFar
}

/**
 * Flake pool. A clear sky uses none of it and a snowfall a quarter, so the pool
 * has to be big enough for the blizzard: at full gust every one of these is on
 * screen.
 */
const FLAKE_COUNT = 820
/** Time constant for a weather front easing into the scene. */
export const WEATHER_BLEND_SECONDS = 8

interface WeatherVisual {
	snow: number
	gust: number
	fog: number
	dark: number
	/** Cloud cover, 0..1: the grey lid and the shadows on the water. */
	cloud: number
}

/**
 * Weather and time-of-day dressing for the winter lake. It never adds HUD
 * text: snow, frost, cold moonlight and lightning tell the player what the
 * world is doing. Intended to sit directly above the scene and below the HUD.
 */

export class AtmosphereBase extends Container {
	protected readonly wash = new Graphics()
	protected readonly glow = new Graphics()
	/** Dark cloud bank around the frame; see `fog.ts`. */
	protected readonly fog = new FogLayer()
	protected readonly snowG = new Graphics()

	protected readonly flakes: Flake[] = []
	protected splashes: Splash[] = []

	protected world: WorldPalette = DAY
	protected weather: WeatherDef = WEATHER.clear
	protected weatherReady = false
	protected readonly visual: WeatherVisual = {
		snow: WEATHER.clear.snow,
		gust: WEATHER.clear.gust,
		fog: WEATHER.clear.fog,
		dark: WEATHER.clear.dark,
		cloud: WEATHER.clear.cloud
	}
	protected time = 0
	/** Phase offsets so the gust pattern differs between sessions. */
	protected readonly gustSeed = randRange(0, Math.PI * 2)
	/**
	 * Bearing of the current front, -1..1, picked once when the front arrives.
	 *
	 * A blizzard used to swing round every few seconds, which read as a flag
	 * snapping in a machine-made wind. A real front keeps one bearing for its
	 * whole life; `windDir` only eases towards it, so the first seconds of a
	 * front do not flip the snow sheet sideways. The gust envelope still makes
	 * the speed pulse, so the snow arrives in bursts without changing sides.
	 */
	protected windDir = 1
	protected windTarget = 1

	protected lightX: number | null = null
	protected lightY: number | null = null
	/**
	 * Open-water test of the current scene. A drop of snow or rain only lands
	 * where there is water to ring; without it the whole frame took splashes,
	 * including the pier planks and the snow banks.
	 */
	protected isWater: ((x: number, y: number) => boolean) | null = null
	protected mood: AreaMood = {
		dark: 0,
		snow: 1,
		wind: 0,
		overlay: 0xffffff,
		overlayAlpha: 0
	}

	constructor() {
		super()
		this.eventMode = 'none'

		for (let i = 0; i < FLAKE_COUNT; i += 1) {
			this.flakes.push({
				x: randRange(-20, VIEW.width + 20),
				y: randRange(-VIEW.height, VIEW.height),
				size: Math.random() > 0.78 ? 2 : 1,
				speed: randRange(12, 34),
				drift: randRange(3, 13),
				phase: randRange(0, Math.PI * 2),
				wind: randRange(0.5, 1.35)
			})
		}

		this.addChild(this.wash, this.glow, this.fog, this.snowG)
	}
}

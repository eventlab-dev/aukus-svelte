import { Container, Graphics, Sprite } from 'pixi.js'
import type { AreaMood } from '../areas'
import { VIEW } from '../config'
import { WEATHER, WINTER, type WeatherDef, type WorldPalette } from '../world'
import { randRange } from '../utils'
import {
	AURORA_FAR,
	AURORA_NEAR,
	AURORA_REFLECTION,
	AuroraReflection,
	AuroraSheet,
	type WaterCoverage
} from './auroraTex'
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
	/** Northern-lights intensity, 0..1. */
	aurora: number
}

/** The sky sheets start just above the frame; the band is intentionally short. */
const AURORA_FAR_Y = -8
const AURORA_NEAR_Y = 0

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
	/**
	 * Two animated curtains of the northern lights and the sheet they cast on
	 * the water. They sit above the wash, so the night darkening does not dim
	 * the light that causes it; snow and fog still draw over them.
	 */
	protected readonly auroraLayer = new Container()
	private readonly reflectionLayer = new Container()
	private readonly reflectionSprite: Sprite
	private readonly farSheet: AuroraSheet
	private readonly nearSheet: AuroraSheet
	private readonly reflection: AuroraReflection
	private readonly auroraFar: Sprite
	private readonly auroraNear: Sprite
	/** Soft water coverage for the reflection; the shoreline is feathered. */
	private waterCoverage: WaterCoverage | null = null

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
		cloud: WEATHER.clear.cloud,
		aurora: WEATHER.clear.aurora
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

		this.farSheet = new AuroraSheet(AURORA_FAR)
		this.nearSheet = new AuroraSheet(AURORA_NEAR)
		this.reflection = new AuroraReflection(this.nearSheet, AURORA_REFLECTION.height)
		this.auroraFar = new Sprite(this.farSheet.texture)
		this.auroraNear = new Sprite(this.nearSheet.texture)
		this.auroraFar.width = VIEW.width
		this.auroraFar.height = this.farSheet.height
		this.auroraNear.width = VIEW.width
		this.auroraNear.height = this.nearSheet.height
		this.auroraFar.position.y = AURORA_FAR_Y
		this.auroraNear.position.y = AURORA_NEAR_Y
		// The sheets are full-frame and animated in place: no tile scroll, so the
		// repeat and the hard hem of the old scrolling tile are both gone.
		this.auroraFar.blendMode = 'screen'
		this.auroraNear.blendMode = 'screen'
		this.auroraFar.alpha = 0
		this.auroraNear.alpha = 0
		this.auroraLayer.addChild(this.auroraFar, this.auroraNear)
		this.auroraLayer.visible = false

		this.reflectionSprite = new Sprite(this.reflection.texture)
		this.reflectionSprite.width = VIEW.width
		this.reflectionSprite.height = AURORA_REFLECTION.height
		this.reflectionSprite.position.y = AURORA_REFLECTION.top
		this.reflectionSprite.blendMode = 'add'
		this.reflectionSprite.alpha = 0
		this.reflectionLayer.addChild(this.reflectionSprite)
		this.reflectionLayer.visible = false

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

		// The wash darkens the frame at night. It used to sit over the curtains,
		// which is why the aurora looked like a stain under the picture instead of
		// light in it: additive light must not be dimmed by the dark it is lighting.
		this.addChild(
			this.wash,
			this.reflectionLayer,
			this.auroraLayer,
			this.glow,
			this.fog,
			this.snowG
		)
	}

	/** 0..1 northern-lights level. */
	get auroraLevel(): number {
		return this.visual.aurora
	}

	/** The water body's current, so the reflection is carried downstream. */
	setCurrent(x: number, y: number): void {
		this.reflection.setFlow(x, y)
	}

	/**
	 * Samples the scene's water test into a coarse, blurred coverage grid.
	 *
	 * The reflection used to be clipped by the water stencil, which ended the
	 * light on a hard shoreline step. A blurred grid in texture space lets the
	 * sheet fade into the bank instead. The grid is built once per scene.
	 */
	protected buildWaterCoverage(): void {
		this.waterCoverage = null
		const isWater = this.isWater
		if (!isWater) return
		const width = 120
		const height = 68
		const raw = new Uint8Array(width * height)
		for (let y = 0; y < height; y += 1) {
			const sy = ((y + 0.5) / height) * VIEW.height
			for (let x = 0; x < width; x += 1) {
				const sx = ((x + 0.5) / width) * VIEW.width
				if (isWater(sx, sy)) raw[y * width + x] = 255
			}
		}
		this.waterCoverage = { data: blurCoverage(raw, width, height, 2), width, height }
	}

	/**
	 * Paints both curtains and the reflection for this frame.
	 *
	 * The motion is in the painting, not in a scroll: the centre line, thickness
	 * and brightness all move on slow incommensurate phases, so the ribbons
	 * undulate in place. A static tile sliding sideways was what made the old
	 * effect read as a moving picture rather than as light.
	 */
	protected updateAurora(): void {
		const intensity = this.visual.aurora
		const visible = intensity > 0.015
		this.auroraLayer.visible = visible
		this.reflectionLayer.visible = visible
		if (!visible) return
		this.farSheet.update(this.time)
		this.nearSheet.update(this.time)
		this.reflection.update(this.time, this.waterCoverage)
		const breathe = 0.84 + Math.sin(this.time * 0.19) * 0.1 + Math.sin(this.time * 0.07) * 0.06
		this.auroraFar.alpha = intensity * 0.4 * breathe
		this.auroraNear.alpha = intensity * 0.58 * breathe
		this.reflectionSprite.alpha = intensity * 0.8
	}
}

/** Two box-blur passes over the coverage grid, clamped at the frame edges. */
function blurCoverage(
	data: Uint8Array,
	width: number,
	height: number,
	radius: number
): Uint8Array {
	let source = new Uint8Array(data)
	let target = new Uint8Array(width * height)
	for (let pass = 0; pass < 2; pass += 1) {
		for (let y = 0; y < height; y += 1) {
			for (let x = 0; x < width; x += 1) {
				let sum = 0
				let count = 0
				for (let dy = -radius; dy <= radius; dy += 1) {
					const sy = Math.max(0, Math.min(height - 1, y + dy))
					for (let dx = -radius; dx <= radius; dx += 1) {
						const sx = Math.max(0, Math.min(width - 1, x + dx))
						sum += source[sy * width + sx]
						count += 1
					}
				}
				target[y * width + x] = Math.round(sum / count)
			}
		}
		const swap = source
		source = target
		target = swap
	}
	return source
}

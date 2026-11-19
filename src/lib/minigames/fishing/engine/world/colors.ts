export interface WorldPalette {
	/** Multiplies the water, shore, scenery and angler. */
	tint: number
	/** Colour of the light wash drawn over the scene. */
	overlay: number
	overlayAlpha: number
	/** 0..1 lantern / firefly glow. */
	lantern: number
	/** Water colours for the minigame column. */
	water: number
	deep: number
}

/**
 * Winter dressing shared by the lake scene and the atmosphere. The time of day
 * still works through the palette tint/overlay; these are the base cold colours
 * of the snow, ice and water.
 */
export const WINTER = {
	snow: 0xe8f2f8,
	snowLight: 0xf7fbfd,
	snowShade: 0xc4d9e6,
	snowBlue: 0x9fbed3,
	ice: 0xbfe8f2,
	iceDeep: 0x86c8d8,
	waterNear: 0x3d9aa6,
	waterMid: 0x267d99,
	waterDeep: 0x18587e,
	waterFar: 0x0a3152,
	farShore: 0x213a40,
	farShoreSnow: 0xdcecf4,
	treeDark: 0x173138,
	frost: 0xd9eaf3,
	star: 0xd9e7ff,
	moon: 0xf3f8ff,
	lantern: 0xffc46b
} as const

/** Depth stops from the near shore (0) to the far bank (1). */
export const WINTER_WATER_STOPS: ReadonlyArray<{ at: number; color: number }> = [
	{ at: 0, color: WINTER.waterNear },
	{ at: 0.3, color: WINTER.waterMid },
	{ at: 0.58, color: WINTER.waterDeep },
	{ at: 1, color: WINTER.waterFar }
]

const DAY: WorldPalette = {
	tint: 0xf3f9ff,
	overlay: 0xffffff,
	overlayAlpha: 0,
	lantern: 0,
	water: WINTER.waterDeep,
	deep: WINTER.waterFar
}

const NIGHT: WorldPalette = {
	tint: 0x8fa2d6,
	overlay: 0x0a1230,
	overlayAlpha: 0.34,
	lantern: 0.9,
	water: 0x143a5c,
	deep: 0x0c2745
}

const DAWN: WorldPalette = {
	tint: 0xe6e6ea,
	overlay: 0xff8a4a,
	overlayAlpha: 0.12,
	lantern: 0.34,
	water: 0x21567a,
	deep: 0x174363
}

const DUSK: WorldPalette = {
	tint: 0xe0d6da,
	overlay: 0xff5f3a,
	overlayAlpha: 0.14,
	lantern: 0.5,
	water: 0x1d4a6c,
	deep: 0x153a58
}

const KEYFRAMES: Array<{ hour: number; palette: WorldPalette }> = [
	{ hour: 0, palette: NIGHT },
	{ hour: 4.2, palette: NIGHT },
	{ hour: 6.2, palette: DAWN },
	{ hour: 9, palette: DAY },
	{ hour: 16.2, palette: DAY },
	{ hour: 18.2, palette: DUSK },
	{ hour: 20.4, palette: NIGHT },
	{ hour: 24, palette: NIGHT }
]

export function mixColor(a: number, b: number, t: number): number {
	const ar = (a >> 16) & 0xff
	const ag = (a >> 8) & 0xff
	const ab = a & 0xff
	const br = (b >> 16) & 0xff
	const bg = (b >> 8) & 0xff
	const bb = b & 0xff
	const r = Math.round(ar + (br - ar) * t)
	const g = Math.round(ag + (bg - ag) * t)
	const bl = Math.round(ab + (bb - ab) * t)
	return (r << 16) | (g << 8) | bl
}

/** Smooth cold gradient colour at depth `t` (0 shore .. 1 far bank). */
export function winterWaterAt(
	t: number,
	stops: ReadonlyArray<{ at: number; color: number }> = WINTER_WATER_STOPS
): number {
	const value = t < 0 ? 0 : t > 1 ? 1 : t
	for (let i = 0; i < stops.length - 1; i += 1) {
		const from = stops[i]
		const to = stops[i + 1]
		if (value >= from.at && value <= to.at) {
			const span = to.at - from.at
			const local = span <= 0 ? 0 : (value - from.at) / span
			return mixColor(from.color, to.color, local)
		}
	}
	return stops[stops.length - 1].color
}

function lerpPalette(a: WorldPalette, b: WorldPalette, t: number): WorldPalette {
	return {
		tint: mixColor(a.tint, b.tint, t),
		overlay: mixColor(a.overlay, b.overlay, t),
		overlayAlpha: a.overlayAlpha + (b.overlayAlpha - a.overlayAlpha) * t,
		lantern: a.lantern + (b.lantern - a.lantern) * t,
		water: mixColor(a.water, b.water, t),
		deep: mixColor(a.deep, b.deep, t)
	}
}

export function paletteAt(minutes: number): WorldPalette {
	const hour = (((minutes % 1440) + 1440) % 1440) / 60
	for (let i = 0; i < KEYFRAMES.length - 1; i += 1) {
		const from = KEYFRAMES[i]
		const to = KEYFRAMES[i + 1]
		if (hour >= from.hour && hour <= to.hour) {
			const t = to.hour === from.hour ? 0 : (hour - from.hour) / (to.hour - from.hour)
			return lerpPalette(from.palette, to.palette, t)
		}
	}
	return NIGHT
}

import type { AreaId, WaterKind } from './types'

export interface AreaLight {
	/** Foot of the fixture: the row that touches the ground, snow or deck. */
	x: number
	y: number
	/**
	 * The flame itself, in the same virtual pixels. The lantern painters centre
	 * their glass on this row and the two glow layers (the scene one and the
	 * atmosphere wash) light it, so a fixture and its light cannot drift apart:
	 * the halo used to be pinned seven pixels under the foot, which put the
	 * brightest part of the lamp on the post instead of on the flame.
	 */
	glowY: number
	color: number
	radius: number
	kind: 'lamp' | 'fire' | 'wisp'
}

/**
 * Everything the fishing scene needs to know about where the angler stands.
 * The scene renderer owns the geometry; the layout keeps gameplay and UI in
 * the same coordinates.
 */
export interface SceneLayout {
	angler: { x: number; y: number }
	/**
	 * Which pose the angler uses. `side` faces right (row 3 of the character
	 * sheet) and `back` looks away from the camera (row 2), for water that is
	 * fished above the angler. Defaults to `side`.
	 */
	anglerView?: 'side' | 'back'
	bobber: {
		minX: number
		maxX: number
		minY: number
		maxY: number
		/**
		 * Direction the float travels when the cast has no usable aim (a pointer
		 * resting on the rod tip). The cast itself follows the cursor; this is the
		 * fallback: `x` casts sideways across the frame, `y` casts away from the
		 * angler toward the top of the frame.
		 */
		axis?: 'x' | 'y'
		/**
		 * Distance of the landing band from the angler along `y`. Without it the
		 * band sits level with the angler, which on a wide channel puts every cast
		 * on the near shelf; with it the band can sit mid-channel.
		 */
		centerY?: number
	}
	hint: {
		x: number
		/** Point the prompt is centred on: a little above the angler's hat. */
		y: number
	}
	light: AreaLight | null
}

/** Per-area atmosphere on top of the shared weather. */
export interface AreaMood {
	/** Extra darkening, 0..1. */
	dark: number
	/** Snowfall multiplier. */
	snow: number
	/** Extra horizontal wind streaks, 0..1. */
	wind: number
	/** Colour washed over the whole scene. */
	overlay: number
	overlayAlpha: number
}

export interface AreaPalette {
	waterStops: readonly { at: number; color: number }[]
	waterFar: number
	farShore: number
	farShoreSnow: number
	treeDark: number
	snow: number
	snowShade: number
	snowLight: number
	ice: number
	iceDeep: number
}

export interface AreaDef {
	id: AreaId
	/**
	 * Water type this body belongs to. The game has exactly one lake, one river
	 * and one sea, so the type doubles as the codex tab and the fish adjective.
	 */
	water: WaterKind
	name: string
	layout: SceneLayout
	mood: AreaMood
	palette: AreaPalette
}

const SNOW = 0xe8f2f8
const SNOW_LIGHT = 0xf7fbfd
const SNOW_SHADE = 0xc4d9e6

export const AREAS: readonly AreaDef[] = [
	{
		// Historical id: this is the lake now, so saved progress keeps working.
		id: 'deep',
		water: 'lake',
		name: 'ЧЁРНЫЙ ОМУТ',
		layout: {
			// The mooring sits a little higher than the old 214: the sky rail owns the
			// bottom of the frame now, and a boat whose stern ran under it read as if
			// the angler were standing in the panel.
			angler: { x: 240, y: 198 },
			// The lake is fished straight ahead, into the middle of the hole.
			anglerView: 'back',
			bobber: {
				// The shortest cast has to leave the whole fight ring in open water and
				// clear of the angler: the ring is 34 px across, the boat sits at y≈194
				// and the rod tip reaches y≈184, so the near edge of the band stops at
				// 138. Anything lower put the bottom of the ring on the boat.
				minX: 206,
				maxX: 274,
				minY: 106,
				maxY: 138,
				axis: 'y'
			},
			// The prompt sits just above the angler's head, over his back, so it
			// reads as his caption instead of floating off to the side of the water.
			// Kept at the same 32 px above the feet as the river and the bay: the
			// lake used to sit 40 px up, which made the same prompt look like it
			// belonged to a different character on that one water body.
			hint: { x: 240, y: 166 },
			// The lantern hangs on the stern rail, off the angler's casting arm, so it
			// lights the boat and the water behind him instead of his rod. The glass
			// hangs 10.5 px above the rail it is tied to: that is where the light is.
			light: {
				x: 247,
				y: 210,
				glowY: 199.5,
				color: 0xffd166,
				radius: 40,
				kind: 'lamp'
			}
		},
		mood: {
			dark: 0.12,
			snow: 0.6,
			wind: 0,
			overlay: 0x0a2a24,
			overlayAlpha: 0.08
		},
		palette: {
			waterStops: [
				{ at: 0, color: 0x2b6f6a },
				{ at: 0.32, color: 0x1c5663 },
				{ at: 0.62, color: 0x123c52 },
				{ at: 1, color: 0x081f30 }
			],
			waterFar: 0x081f30,
			farShore: 0x13262a,
			farShoreSnow: 0xd6e4e6,
			treeDark: 0x0d1e22,
			snow: 0xdfe9e8,
			snowShade: 0xb9cfd0,
			snowLight: 0xf0f8f7,
			ice: 0xa9d6d6,
			iceDeep: 0x6aa5a8
		}
	},
	{
		// Historical id: this bank used to be the "Студеные Пороги" rapids. Keeping
		// it lets saved progress and the ambience map stay valid.
		id: 'rapids',
		water: 'river',
		name: 'СТУДЁНЫЙ ПЛЁС',
		layout: {
			angler: { x: 96, y: 206 },
			bobber: {
				// The channel is ~200px deep here, so a cast level with the angler
				// lands on the near shelf. The float is aimed at the middle of the
				// reach instead: up and to the left of where it used to fall, into the
				// wide open water in front of the angler rather than downstream past
				// him.
				//
				// The band stays inside the ring-clearance rules at every aim: its
				// nearest corner is far enough from the angler for the whole ring, and
				// the rim never reaches either bank (near shelf at 214-218 down this
				// stretch, far ice rim at 32-52).
				minX: 152,
				maxX: 262,
				minY: 108,
				maxY: 168,
				centerY: 132
			},
			hint: { x: 96, y: 174 },
			// The lantern stands a little further along the bank: at 50 it crowded the
			// near-corner fir and its post sat on the edge of the drift, so the whole
			// fixture — post, glass and the light it throws — moved right as one. The
			// glass is 9 px above the foot of the post.
			light: {
				x: 54,
				y: 206,
				glowY: 197,
				color: 0xffc46b,
				radius: 46,
				kind: 'lamp'
			}
		},
		mood: {
			dark: 0,
			snow: 1.1,
			wind: 0.14,
			overlay: 0xd9ecff,
			overlayAlpha: 0.03
		},
		palette: {
			waterStops: [
				{ at: 0, color: 0x4fa2a4 },
				{ at: 0.22, color: 0x2f8296 },
				{ at: 0.55, color: 0x1a5570 },
				{ at: 1, color: 0x0e3448 }
			],
			waterFar: 0x0e3448,
			farShore: 0x223a34,
			farShoreSnow: 0xdcecf4,
			treeDark: 0x173330,
			snow: 0xe8f2f8,
			snowShade: 0xc0d7e4,
			snowLight: 0xf7fbfd,
			ice: 0xbfe8f2,
			iceDeep: 0x86c8d8
		}
	},
	{
		// Historical id: the cove is the sea bay now. The pier, the far pine shore
		// and the lantern read as a sheltered northern bay.
		id: 'cove',
		water: 'sea',
		name: 'СОСНОВАЯ БУХТА',
		layout: {
			angler: { x: 156, y: 144 },
			bobber: {
				// Casting off the pier into the bay. The pier's seaward edge is at
				// x=172, so the near edge of the band starts at 218: the ring's left
				// rim stays on open water and 62 px away from the angler even at the
				// shortest cast, instead of hanging over the planks.
				//
				// The near side stops at 218, not at the bottom of the frame: the sky
				// rail owns the strip from y=242 and the fight ring is 22 px wide from
				// its centre, so a float dropped at 242 put the whole bottom of the
				// zone — the fish and its escape arc — behind the panel. `castSafety`
				// clamps every cast to that line anyway; the band says it here so the
				// tuned area and the rule cannot disagree.
				minX: 218,
				maxX: 300,
				minY: 44,
				maxY: 218
			},
			hint: { x: 156, y: 112 },
			// The pier lamp is the shortest of the three: its glass sits 6.5 px over
			// the deck it stands on.
			light: {
				x: 168,
				y: 124,
				glowY: 117.5,
				color: 0xffc46b,
				radius: 44,
				kind: 'lamp'
			}
		},
		mood: {
			dark: 0,
			snow: 1,
			wind: 0,
			overlay: 0xffffff,
			overlayAlpha: 0
		},
		palette: {
			// Coastal turquoise instead of a deep bay: the sea is the one place where
			// the water is shallow enough to read as green-blue, and the chop texture
			// in `cove.ts` needs a mid-tone bed to sit on.
			waterStops: [
				{ at: 0, color: 0x5cc4cf },
				{ at: 0.3, color: 0x39a6bb },
				{ at: 0.6, color: 0x2380a0 },
				{ at: 1, color: 0x11587f }
			],
			waterFar: 0x11587f,
			farShore: 0x213a40,
			farShoreSnow: 0xdcecf4,
			treeDark: 0x173138,
			snow: SNOW,
			snowShade: SNOW_SHADE,
			snowLight: SNOW_LIGHT,
			ice: 0xbfe8f2,
			iceDeep: 0x86c8d8
		}
	}
] as const

export const AREA_BY_ID: Record<AreaId, AreaDef> = Object.fromEntries(
	AREAS.map((area) => [area.id, area])
) as Record<AreaId, AreaDef>

export const DEFAULT_AREA_ID: AreaId = 'deep'

export function isAreaId(value: unknown): value is AreaId {
	return typeof value === 'string' && value in AREA_BY_ID
}

import { FISH_TEXT } from '../texts'
import type { FishSpecies } from './species'
import { win } from './windows'

/** The 12 river species: flowing water, estuary and cold current. */
export const RIVER_FISH: readonly FishSpecies[] = [
	{
		id: 'minnow',
		name: FISH_TEXT.minnow.name,
		weightKg: [0.02, 0.1],
		speed: 0.38,
		resistance: 0.24,
		tint: 0x9fb7a8,
		tier: 'common',
		area: 'rapids',
		behavior: 'minnow'
	},
	{
		id: 'capelin',
		name: FISH_TEXT.capelin.name,
		weightKg: [0.05, 0.2],
		speed: 0.34,
		resistance: 0.185,
		tint: 0xa3a7c2,
		tier: 'common',
		area: 'rapids',
		behavior: 'capelin'
	},
	{
		id: 'chub',
		name: FISH_TEXT.chub.name,
		weightKg: [0.5, 2.2],
		speed: 0.57,
		resistance: 0.225,
		tint: 0x8f9a6a,
		tier: 'common',
		area: 'rapids',
		behavior: 'chub',
		weather: ['clear', 'overcast']
	},
	{
		id: 'flounder',
		name: FISH_TEXT.flounder.name,
		weightKg: [0.4, 1.8],
		speed: 0.4,
		resistance: 0.195,
		tint: 0xcf752b,
		tier: 'common',
		area: 'rapids',
		behavior: 'flounder',
		weather: ['clear', 'overcast']
	},
	{
		id: 'rainbowtrout',
		name: FISH_TEXT.rainbowtrout.name,
		weightKg: [0.8, 3.5],
		speed: 0.62,
		resistance: 0.235,
		tint: 0xff8933,
		tier: 'uncommon',
		area: 'rapids',
		behavior: 'rainbowtrout',
		weather: ['clear']
	},
	{
		id: 'mudskipper',
		name: FISH_TEXT.mudskipper.name,
		weightKg: [0.1, 0.5],
		speed: 0.74,
		resistance: 0.31,
		tint: 0x8f7a58,
		tier: 'common',
		area: 'rapids',
		behavior: 'mudskipper'
	},
	{
		id: 'shrimp',
		name: FISH_TEXT.shrimp.name,
		weightKg: [0.02, 0.1],
		speed: 0.34,
		resistance: 0.18,
		tint: 0xff8a7a,
		tier: 'uncommon',
		area: 'rapids',
		behavior: 'capelin',
		windows: [win(22, 4)]
	},
	{
		id: 'seabass',
		name: FISH_TEXT.seabass.name,
		weightKg: [1, 6],
		speed: 0.7,
		resistance: 0.25,
		tint: 0x8fb7c2,
		tier: 'uncommon',
		area: 'rapids',
		behavior: 'walleye'
	},
	{
		id: 'salmon',
		name: FISH_TEXT.salmon.name,
		weightKg: [2, 9],
		speed: 0.72,
		resistance: 0.245,
		tint: 0xff7a6a,
		tier: 'rare',
		area: 'rapids',
		behavior: 'salmon',
		windows: [win(5, 9)]
	},
	{
		id: 'eel',
		name: FISH_TEXT.eel.name,
		weightKg: [1, 5],
		speed: 0.78,
		resistance: 0.26,
		tint: 0x4a5a3a,
		tier: 'rare',
		area: 'rapids',
		behavior: 'eel',
		windows: [win(20, 4)],
		weather: ['snow', 'blizzard']
	},
	{
		id: 'tigerfish',
		name: FISH_TEXT.tigerfish.name,
		weightKg: [2, 8],
		speed: 0.78,
		resistance: 0.25,
		tint: 0xd0a04a,
		tier: 'rare',
		area: 'rapids',
		behavior: 'tigerfish',
		weather: ['clear', 'blizzard']
	},
	{
		id: 'sturgeon',
		name: FISH_TEXT.sturgeon.name,
		weightKg: [10, 45],
		speed: 1,
		resistance: 0.31,
		tint: 0x2ce8f5,
		tier: 'mythic',
		area: 'rapids',
		behavior: 'sturgeon',
		weather: ['blizzard', 'fog']
	}
]

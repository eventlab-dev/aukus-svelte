export const EMOTES_SEARCH_API_URL = 'https://api4.rhhhhhhh.live/search_emotes'
export const SEVENTV_EMOTE_BASE_URL = 'https://starege.rhhhhhhh.live/https://cdn.7tv.app/emote'
export const FALLBACK_GAME_POSTER =
	'https://www.igdb.com/assets/no_cover_show-ef1e36c00e101c2fb23d15bb80edd9667bbf604a12fc0267a66033afea320c65.png'

export const routes = [
	{
		title: 'Карта',
		url: '/'
	},
	{
		title: 'Таблица',
		url: '/leaderboard'
	},
	{
		title: 'Правила',
		url: '/rules'
	},
	{
		title: 'Создатели',
		url: '/developers'
	}
]

export const playerColors = {
	blue: '#007AFF',
	green: '#34C759',
	pink: '#ECA3D4',
	orange: '#FF8D28',
	purple: '#AF52DE',
	darkBlue: '#5856D6',
	red: '#E8142C',
	brown: '#AC7F5E',
	yellow: '#F2C200',
	lightBlue: '#32ADE6',
	brightPink: '#FF2D55'
} as const

// Mapping of Russian characters to arrays of phonetically similar English characters (lowercase only)
export const transliterationMap: { [key: string]: string[] } = {
	а: ['a', 'u', 'ia'],
	б: ['b', 'v'],
	в: ['v', 'w'],
	г: ['g', 'h'],
	д: ['d', 'j'],
	е: ['e', 'ye', 'a'],
	ё: ['yo', 'io'],
	ж: ['zh', 'j'],
	з: ['z', 's'],
	и: ['i', 'y', 'ee'],
	й: ['y'],
	к: ['k', 'c'],
	л: ['l'],
	м: ['m'],
	н: ['n'],
	о: ['o'],
	п: ['p'],
	р: ['r'],
	с: ['s'],
	т: ['t'],
	у: ['u', 'oo'],
	ф: ['f', 'v'],
	х: ['kh', 'h', 'ch'],
	ц: ['ts', 'c'],
	ч: ['ch', 'tch'],
	ш: ['sh'],
	щ: ['shch'],
	ы: ['y', 'i'],
	э: ['e', 'a'],
	ю: ['yu', 'iu'],
	я: ['ya', 'ia']
}

export const gameLengthRanges: Record<GameLength, string> = {
	'0-3': '0-3ч',
	'3-15': '3-15ч',
	'15-30': '15-30ч',
	'30+': '30+ч'
}

import ARMY_SOUND_URL from '$lib/assets/sounds/army-roll.mp3'
import INDIAN_ROLL_URL from '$lib/assets/sounds/indian-roll.mp3'
import DRUM_SOUND_URL from '$lib/assets/sounds/baraban.mp3'
import MAX_SOUND_URL from '$lib/assets/sounds/max-roll2.mp3'
import DASBOOT_SOUND_URL from '$lib/assets/sounds/dasboot-roll.mp3'
import DVAR_SOUND_URL from '$lib/assets/sounds/dvar-roll.mp3'
import type { GameLength } from './heyapi/aukus/types.gen'

export const SOUNDS = [
	{ key: 'army', url: ARMY_SOUND_URL },
	{ key: 'indian', url: INDIAN_ROLL_URL },
	{ key: 'drum', url: DRUM_SOUND_URL },
	{ key: 'max', url: MAX_SOUND_URL },
	{ key: 'dasboot', url: DASBOOT_SOUND_URL },
	{ key: 'dvar', url: DVAR_SOUND_URL }
]

export const CDN_URL_BASE = 'https://storage.yandexcloud.net/eventlab/assets/aukus4'

export const MapMarkerIce = `${CDN_URL_BASE}/map/marker_ice.png`
export const MapMarkerFire = `${CDN_URL_BASE}/map/marker_fire.png`
export const MapMarkerSwamp = `${CDN_URL_BASE}/map/marker_swamp.png`
export const MapMarkerDungeon = `${CDN_URL_BASE}/map/marker_dungeon.png`
export const MapMarkerForest = `${CDN_URL_BASE}/map/marker_forest.png`
export const MapMarkerStart = `${CDN_URL_BASE}/map/marker_start.png`
export const MapMarkerFinish = `${CDN_URL_BASE}/map/marker_finish.png`

export const PlayerBaseModelUrl = `${CDN_URL_BASE}/map/player_model.png`

export const MAP_IMAGE = `${CDN_URL_BASE}/map/map_demo.png`
// export const MAP_IMAGE = `/map_final.png`

export const DICE_ROLL_ANIMATION_TIME = 2000
export const DICE_ROLL_IDLE_TIME = 2000

export const AchievementBackgroundUrl = `${CDN_URL_BASE}/utils/achievement_background.png`

export const DiceModelUrl = `${CDN_URL_BASE}/dice_skins/dice_model.glb`
export const DefaultDiceTexture = `${CDN_URL_BASE}/dice_skins/default_texture.png`

export const LastMapPosition = 101

export const EventTitles: { [k: string]: string } = {
	aukus1: 'Аукус 1',
	aukus2: 'Аукус 2',
	aukus3: 'Аукус 3',
	aukus4: 'Аукус 4'
}

import type { GameDifficulty, GameLength } from './heyapi/aukus/types.gen'

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

export const gameLengthRanges: Record<GameLength, string> = {
	'0-4': '0-4ч',
	'5-10': '5-10ч',
	'11-16': '11-16ч',
	'17-24': '17-24ч',
	'25-40': '25-39ч',
	'40+': '40+ч'
}

export const CDN_URL_BASE = 'https://storage.yandexcloud.net/eventlab/assets/aukus4'

export const CDN_URL_BASE5 = 'https://storage.yandexcloud.net/eventlab/assets/aukus5'

export const MapMarkerIce = `${CDN_URL_BASE}/map/marker_ice.png`
export const MapMarkerFire = `${CDN_URL_BASE}/map/marker_fire.png`
export const MapMarkerSwamp = `${CDN_URL_BASE}/map/marker_swamp.png`
export const MapMarkerDungeon = `${CDN_URL_BASE}/map/marker_dungeon.png`
export const MapMarkerForest = `${CDN_URL_BASE}/map/marker_forest.png`
export const MapMarkerStart = `${CDN_URL_BASE}/map/marker_start.png`
export const MapMarkerFinish = `${CDN_URL_BASE}/map/marker_finish.png`

export const PlayerBaseModelUrl = `${CDN_URL_BASE}/map/player_model.png`

export const MAP_IMAGE = `${CDN_URL_BASE5}/map/map.jpg`
export const MAP_SIDE_IMAGE = `${CDN_URL_BASE5}/map/map-side.jpg`
export const TOP_BANNER = `${CDN_URL_BASE5}/ui/top-banner.png`
export const PAGE_BG = `${CDN_URL_BASE5}/ui/page-bg.jpg`

export const DICE_ROLL_ANIMATION_TIME = 2000
export const DICE_ROLL_IDLE_TIME = 2000

export const AchievementBackgroundUrl = `${CDN_URL_BASE}/utils/achievement_background.png`

export const DiceModelUrl = `${CDN_URL_BASE}/dice_skins/dice_model.glb`
export const DefaultDiceTexture = `${CDN_URL_BASE}/dice_skins/default_texture.png`
export const FINAL_VIDEO_POSTER = `${CDN_URL_BASE}/final_video_poster.png`

const SOUNDS_URL_BASE = `https://storage.yandexcloud.net/eventlab/assets/eventlab/wheel/sounds`

const ARMY_SOUND_URL = `${SOUNDS_URL_BASE}/army-roll.mp3`
const INDIAN_ROLL_URL = `${SOUNDS_URL_BASE}/indian-roll.mp3`
const DRUM_SOUND_URL = `${SOUNDS_URL_BASE}/baraban.mp3`
const MAX_SOUND_URL = `${SOUNDS_URL_BASE}/max-roll.mp3`
const DASBOOT_SOUND_URL = `${SOUNDS_URL_BASE}/dasboot-roll.mp3`
const DVAR_SOUND_URL = `${SOUNDS_URL_BASE}/dvar-roll.mp3`

export const SOUNDS = [
	{ key: 'army', url: ARMY_SOUND_URL },
	{ key: 'indian', url: INDIAN_ROLL_URL },
	{ key: 'drum', url: DRUM_SOUND_URL },
	{ key: 'max', url: MAX_SOUND_URL },
	{ key: 'dasboot', url: DASBOOT_SOUND_URL },
	{ key: 'dvar', url: DVAR_SOUND_URL }
]

export const LastMapPosition = 101

export const EventTitles: { [k: string]: string } = {
	aukus1: 'Аукус 1',
	aukus2: 'Аукус 2',
	aukus3: 'Аукус 3',
	aukus4: 'Аукус 4',
	MGE: 'МГЕ',
	igropolius: 'Игрополиус'
}

export const DifficultyTitle: { [k in GameDifficulty]: string } = {
	'-1': 'Легкий',
	0: 'Нормальный',
	1: 'Сложный',
	2: 'Очень сложный'
}

export const LOGO_URL = `${CDN_URL_BASE}/map/logo.avif`
export const LOGO_BG_URL = `${CDN_URL_BASE}/map/logo-bg.avif`

export const FALLBACK_AVATAR_URL = 'https://github.com/shadcn.png'
export const MOVIE_POSTER_URL = `${CDN_URL_BASE}/utils/movie_poster.png`

export const PAGE_SCROLL_ID = 'page-scroll'


// Z index list
// page-container z-20
// dialogs z-50
// popovers z-50
// errors notifications z-50
// smartphone nav z-50
// dice animation z-50
// fireworks z-9
export const EMOTES_SEARCH_API_URL = 'https://api4.rhhhhhhh.live/search_emotes';
export const SEVENTV_EMOTE_BASE_URL = 'https://starege.rhhhhhhh.live/https://cdn.7tv.app/emote';
export const FALLBACK_GAME_POSTER =
	'https://www.igdb.com/assets/no_cover_show-ef1e36c00e101c2fb23d15bb80edd9667bbf604a12fc0267a66033afea320c65.png';

export const routes = [
	{
		title: 'Главная',
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
];

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
	brightPink: '#FF2D55',
} as const;

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
	я: ['ya', 'ia'],
}

export const gameLengthRanges = {
	tiny: '0-5ч',
	short: '5-15ч',
	medium: '15-30ч',
	long: '30+ч'
} as const;

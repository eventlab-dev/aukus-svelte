import type { FishTier, WaterKind, WeatherId } from './types'

export interface FishText {
	name: string
	/**
	 * One short character line. The codex prints the name and water type on
	 * their own lines and appends this to the habits:
	 * «Ловится всегда, предельно глупая, но тяжелая.»
	 */
	temper: string
}

/** Names and one-line character for all 40 species. */
export const FISH_TEXT = {
	angelfish: {
		name: 'Лещ',
		temper: 'медлительная, но упрямая'
	},
	bluegill: {
		name: 'Солнечник',
		temper: 'круглая и ленивая, почти не сопротивляется'
	},
	carp: {
		name: 'Карп',
		temper: 'предельно глупая, но тяжелая'
	},
	catfish: {
		name: 'Сом',
		temper: 'тяжелая и упорная'
	},
	chub: {
		name: 'Голавль',
		temper: 'осторожная, но жадная до приманки'
	},
	koi: {
		name: 'Кои',
		temper: 'капризная, но упрямая'
	},
	largemouthbass: {
		name: 'Большеротый окунь',
		temper: 'ленивая, но упрямая'
	},
	minnow: {
		name: 'Гольян',
		temper: 'мелкая, пугливая, но клюет без разбору'
	},
	mudskipper: {
		name: 'Илистый прыгун',
		temper: 'юркая и скользкая'
	},
	perch: {
		name: 'Окунь',
		temper: 'жадная и упрямая'
	},
	pike: {
		name: 'Щука',
		temper: 'туповата, но силы много'
	},
	rainbowtrout: {
		name: 'Тигровая форель',
		temper: 'вертлявая и пугливая'
	},
	salmon: {
		name: 'Лосось',
		temper: 'сильная и упрямая'
	},
	smallmouthbass: {
		name: 'Лесоплюх',
		temper: 'прыткая и осторожная'
	},
	sturgeon: {
		name: 'Осетр',
		temper: 'древняя, тяжелая и упорная'
	},
	tigerfish: {
		name: 'Тигровая рыба',
		temper: 'зубастая и злая'
	},
	tilapia: {
		name: 'Тиляпия',
		temper: 'покладистая и медлительная'
	},
	walleye: {
		name: 'Желтый судак',
		temper: 'осторожная, но упорная'
	},
	anchovy: {
		name: 'Анчоус',
		temper: 'мелкая, стайная, безобидная'
	},
	barracuda: {
		name: 'Барракуда',
		temper: 'стремительная и злая'
	},
	butterflyfish: {
		name: 'Рыба-бабочка',
		temper: 'яркая, но упрямая'
	},
	capelin: {
		name: 'Шэд',
		temper: 'мелкая, серебристая, покладистая'
	},
	clownfish: {
		name: 'Рыба-клоун',
		temper: 'полосатая и юркая'
	},
	cod: {
		name: 'Сомик',
		temper: 'придонная и упорная'
	},
	eel: {
		name: 'Угорь',
		temper: 'скользкая и верткая'
	},
	flounder: {
		name: 'Песковник',
		temper: 'сонная, но упрямая'
	},
	grouper: {
		name: 'Пятнистый криворот',
		temper: 'медлительная, но упрямая'
	},
	haddock: {
		name: 'Пикша',
		temper: 'спокойная и упорная'
	},
	halibut: {
		name: 'Палтус',
		temper: 'плоская, тяжелая и невероятно упорная'
	},
	lionfish: {
		name: 'Иглобрюх',
		temper: 'колючая и злая'
	},
	mackerel: {
		name: 'Скумбрия',
		temper: 'быстрая и живучая'
	},
	marlin: {
		name: 'Марлин',
		temper: 'свирепая, быстрая и неукротимая'
	},
	oarfish: {
		name: 'Сельдяной король',
		temper: 'ленточная, загадочная и верткая'
	},
	oceansunfish: {
		name: 'Луна-рыба',
		temper: 'неповоротливая, но тяжелая'
	},
	redsnapper: {
		name: 'Берикс',
		temper: 'резкая и упорная'
	},
	sardine: {
		name: 'Сардина',
		temper: 'стайная и осторожная'
	},
	seabass: {
		name: 'Сибас',
		temper: 'осторожная и сильная'
	},
	shrimp: {
		name: 'Креветка',
		temper: 'мелкая, но заводная'
	},
	swordfish: {
		name: 'Меч-рыба',
		temper: 'дерзкая, сильная и неукротимая'
	},
	tuna: {
		name: 'Тунец',
		temper: 'тяжелая, быстрая и упорная'
	}
} satisfies Record<string, FishText>

export const WEATHER_LABEL: Record<WeatherId, string> = {
	clear: 'ЯСНО',
	overcast: 'ОБЛАЧНО',
	snow: 'СНЕГОПАД',
	blizzard: 'МЕТЕЛЬ',
	fog: 'ТУМАН'
}

/** Accusative weather phrase used by the generated codex sentence. */
export const WEATHER_CASE: Record<WeatherId, string> = {
	clear: 'ясную погоду',
	overcast: 'облачную погоду',
	snow: 'снегопад',
	blizzard: 'метель',
	fog: 'туман'
}

/** Short water type label for tabs and cards. */
export const WATER_LABEL: Record<WaterKind, string> = {
	lake: 'ОЗЕРО',
	sea: 'МОРЕ',
	river: 'РЕКА'
}

/** Rarity label used by badges and the codex tooltip. */
export const TIER_LABEL: Record<FishTier, string> = {
	common: 'ОБЫЧНАЯ',
	rare: 'РЕДКАЯ',
	legendary: 'ЛЕГЕНДАРНАЯ'
}

export interface HelpPage {
	id: HelpPageId
	title: string
	lines: readonly string[]
}

export type HelpPageId = 'cast' | 'fight' | 'counter' | 'land'

/**
 * The manual, as four short lessons: one step of a round each, three lines of
 * copy and one still of the real UI. The copy is deliberately terse — a popup
 * the player opens mid-session is read, not studied — but every line carries a
 * rule the game actually enforces.
 *
 * This is the desktop copy: it names the left and right mouse buttons. On a
 * phone the same four lessons are the touch ones below, because a manual that
 * says «ПКМ» on a screen with no mouse is read as a bug.
 */
export const HELP_PAGES: readonly HelpPage[] = [
	{
		id: 'cast',
		title: 'ЗАБРОС',
		lines: [
			'Зажми ЛКМ и отпусти в зеленой зоне.',
			'Зеленая зона повышает шанс редкой рыбы.',
			'На «!» подсекай сразу — иначе сорвется.'
		]
	},
	{
		id: 'fight',
		title: 'БОРЬБА',
		lines: [
			'Держи рыбу внутри круга: зажми и веди против ее хода.',
			'Зеленая полоса — силы рыбы.',
			'Синяя полоса — твоя хватка: держишь — тратится.'
		]
	},
	{
		id: 'counter',
		title: 'КОНТРРЫВОК',
		lines: [
			'Сектор вспыхнул — зажми его и потяни к центру.',
			'Красная стрелка — рывок, фиолетовая — обманка.',
			'Вовремя зажатый контр гасит рывок.'
		]
	},
	{
		id: 'land',
		title: 'ПОИМКА',
		lines: [
			'Золотой круг — рыба готова: ПКМ или F.',
			'Или дождись нуля — поймается сама.',
			'Вес и вид записываются в справочник (C).'
		]
	}
]

/**
 * The same four lessons for a finger: no mouse button is named, and the press,
 * the drag and the tap are described as the hand makes them.
 */
const HELP_PAGES_TOUCH: readonly HelpPage[] = [
	{
		id: 'cast',
		title: 'ЗАБРОС',
		lines: [
			'Жми «ЗАБРОСИТЬ» и отпусти в зеленой зоне.',
			'Зеленая зона повышает шанс редкой рыбы.',
			'На «!» жми стик — иначе сорвется.'
		]
	},
	{
		id: 'fight',
		title: 'БОРЬБА',
		lines: [
			'Держи стик и веди против хода рыбы.',
			'Зеленая полоса — силы рыбы.',
			'Синяя полоса — твоя хватка: держишь стик — тратится.'
		]
	},
	{
		id: 'counter',
		title: 'КОНТРРЫВОК',
		lines: [
			'Сектор вспыхнул — толкни стик в его сторону и потяни назад.',
			'Красный сектор — рывок, фиолетовый — обманка.',
			'Вовремя потянул — рывок погашен.'
		]
	},
	{
		id: 'land',
		title: 'ПОИМКА',
		lines: [
			'Золотой круг — жми «ПОЙМАТЬ».',
			'Или дождись нуля — поймается сама.',
			'Вес и вид записываются в справочник.'
		]
	}
]

/** The manual for the input the player has in their hands. */
export function helpPages(touch: boolean): readonly HelpPage[] {
	return touch ? HELP_PAGES_TOUCH : HELP_PAGES
}

const KG = 'кг'

export const TEXT = {
	page: {
		title: 'Зимняя рыбалка',
		description:
			'Зимняя рыбалка — пиксельная рыбалка в трех водоемах со справочником и сохранением прогресса.'
	},
	common: {
		back: 'НАЗАД',
		menu: 'В МЕНЮ',
		play: 'ИГРАТЬ',
		howToPlay: 'КАК ИГРАТЬ',
		exit: 'ВЫХОД',
		soundOn: 'ЗВУК: ВКЛ',
		soundOff: 'ЗВУК: ВЫКЛ',
		pause: 'ПАУЗА',
		resume: 'ПРОДОЛЖИТЬ',
		restart: 'ЗАНОВО',
		ariaLabel: 'Игра «Зимняя рыбалка»',
		dash: '—',
		ellipsis: '…',
		kg: KG
	},
	menu: {
		title: 'ЗИМНЯЯ РЫБАЛКА'
	},
	game: {
		readyToCast: 'ЗАБРОСИТЬ',
		castKey: 'ЛКМ',
		/** Touch landing button: the fish is on the threshold. */
		land: 'ПОЙМАТЬ',
		/** Caption on the stick while a bite waits to be struck. */
		hook: 'ПОДСЕЧКА',
		earlyHook: 'РАНО!',
		lostFish: 'СОРВАЛАСЬ…',
		missedHook: 'НЕ УСПЕЛ',
		gripOut: 'НЕТ СИЛ',
		newSpecies: 'НОВЫЙ ВИД',
		catchFeedback: (name: string, weight: string): string =>
			`${name.toUpperCase()}\n${weight} ${KG}`
	},
	/** Labels of the travel cards between water bodies. */
	areas: {
		/** Stands in for the name of a water body the host has closed. */
		closed: 'НЕДОСТУПНО'
	},
	/** Sky rail at the bottom of the round: the live front's caption. */
	forecast: {
		now: 'СЕЙЧАС'
	},
	codex: {
		title: 'СПРАВОЧНИК',
		window: 'ОКНО',
		weather: 'ПОГОДА',
		anytime: 'КРУГЛОСУТОЧНО',
		anyWeather: 'ЛЮБАЯ',
		record: (caught: number, best: string): string => `ПОЙМАНО: ${caught} · РЕКОРД: ${best} КГ`,
		/** Roster-slot corners: the record weight left, the catch count right. */
		slotWeight: (best: string): string => `${best} КГ`,
		slotCount: (caught: number): string => `x${caught}`,
		/** Shown instead of the name and the notes until the first catch. */
		unknown: '???',
		locked: 'ЕЩЕ НЕ ПОЙМАНА.\nЗАПИСЬ ОТКРОЕТСЯ ПОСЛЕ ПОИМКИ.'
	},
	help: {
		title: 'КАК ИГРАТЬ'
	},
	/**
	 * Text of the stub a phone gets while it is held in portrait. The game is
	 * laid out for a wide frame, so the only useful thing to say is how to get
	 * back to it.
	 */
	mobile: {
		rotateTitle: 'ПОВЕРНИТЕ ТЕЛЕФОН',
		rotateHint: 'Игра идет в альбомной ориентации'
	},
	/** Dev-only audio balance panel (`F2`) and the sky inspector (`F3`). */
	devtools: {
		title: 'ЗВУК: БАЛАНС',
		hint: 'КНОПКА У НАЗВАНИЯ — ПОСЛУШАТЬ · F2 / ESC — ЗАКРЫТЬ',
		/** One window for the front, the hour and the water. */
		sky: 'НЕБО · ВОДА · DEV',
		skyHint: 'F3 / ESC — ЗАКРЫТЬ',
		weatherRow: 'ПОГОДА',
		timeRow: 'ВРЕМЯ',
		/** Header of the water knobs under the sky rows. */
		waterRow: 'ВОДА',
		timeAuto: 'СЕЙЧАС',
		/** Presets of the sky inspector, each pinned to a representative hour. */
		timePresets: {
			night: 'НОЧЬ',
			morning: 'УТРО',
			day: 'ДЕНЬ',
			evening: 'ВЕЧЕР'
		},
		reset: 'СБРОС',
		sound: 'ЗВУК',
		soundOn: 'ЗВУК: ВКЛ',
		soundOff: 'ЗВУК: ВЫКЛ',
		close: 'ЗАКРЫТЬ',
		resetDone: 'СБРОШЕНО К ЗНАЧЕНИЯМ ИЗ КОДА'
	},
	boot: {
		loading: 'ЗАГРУЗКА',
		/**
		 * Captions under the rail, one per stage of the boot, in load order.
		 *
		 * The line used to print the name of the asset being fetched — `liche_1.png`
		 * or `tiny5-cyrillic.woff2`, shortened to 34 characters. A file name tells a
		 * player nothing about how far along the boot is, and a truncated one tells
		 * them even less; the bar already says *how much*, so the caption only has
		 * to say *what* is being done.
		 */
		stages: [
			'ГОТОВИМ ШРИФТЫ',
			'СОБИРАЕМ ВОДОЁМЫ',
			'ЗАСЕЛЯЕМ РЫБУ',
			'НАСТРАИВАЕМ ЗВУК',
			'ПОЧТИ ГОТОВО'
		],
		/**
		 * Gate on a touch screen: the tap it asks for is also the gesture that
		 * unlocks the audio and lets the browser go fullscreen.
		 */
		pressToStart: 'НАЖМИТЕ, ЧТОБЫ ПРОДОЛЖИТЬ'
	},
	fish: FISH_TEXT
} as const

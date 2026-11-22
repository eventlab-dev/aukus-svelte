import type { AreaId, FishTier, WaterKind, WeatherId } from './types'

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

/** One pearl variety: display name and a line about its shape and overtone. */
export interface PearlText {
	name: string
	desc: string
}

/**
 * The twelve varieties of the first pearl set. All of them are legendary in the
 * codex; the variety is what the hunter collects, not a second rarity class.
 */
export const PEARL_TEXT = {
	freshwater: {
		name: 'Пресноводный',
		desc: 'Вытянутая речная жемчужина с мягким голубым отливом.'
	},
	drop: {
		name: 'Капля',
		desc: 'Ровная грушевидная жемчужина, редкая для ракушки.'
	},
	mabe: {
		name: 'Мабе',
		desc: 'Плоская половинка, выросшая на стенке раковины.'
	},
	baroque: {
		name: 'Барокко',
		desc: 'Неправильная форма — у каждой свой рисунок.'
	},
	keshi: {
		name: 'Кеши',
		desc: 'Мелкая, но плотная; блестит ярче крупных.'
	},
	akoya: {
		name: 'Акойя',
		desc: 'Классическая белая, холодная и ровная.'
	},
	ring: {
		name: 'Кольцо',
		desc: 'Жемчужина с просветом, который не объяснить.'
	},
	golden: {
		name: 'Золотой',
		desc: 'Южное золото: тёплое, глубокое, тяжёлое.'
	},
	conch: {
		name: 'Розовый конх',
		desc: 'Розовая, как внутренняя губа раковины.'
	},
	southsea: {
		name: 'Южное море',
		desc: 'Крупная, с длинным многоцветным переливом.'
	},
	tahitian: {
		name: 'Таитянский',
		desc: 'Тёмная, с павлиньим хвостом в отливе.'
	},
	flame: {
		name: 'Огненный',
		desc: 'Оранжевая, будто внутри тлеет уголёк.'
	}
} satisfies Record<string, PearlText>

/** Short codex tab names: four segments have to fit the 248 px bar. */
export const CODEX_TAB_LABEL: Record<AreaId, string> = {
	deep: 'ОМУТ',
	rapids: 'ПЛЁС',
	cove: 'БУХТА'
}

/** Labels of the five flaw bands, from chalky to flawless. */
export const PEARL_BAND_LABEL = {
	chalky: 'МЕЛОВОЙ',
	matte: 'МАТОВЫЙ',
	satin: 'АТЛАСНЫЙ',
	glossy: 'ГЛЯНЦЕВЫЙ',
	mirror: 'ЗЕРКАЛЬНЫЙ'
} as const

export const WEATHER_LABEL: Record<WeatherId, string> = {
	clear: 'ЯСНО',
	overcast: 'ОБЛАЧНО',
	snow: 'СНЕГОПАД',
	blizzard: 'МЕТЕЛЬ',
	fog: 'ТУМАН',
	aurora: 'СИЯНИЕ'
}

/** Accusative weather phrase used by the generated codex sentence. */
export const WEATHER_CASE: Record<WeatherId, string> = {
	clear: 'ясную погоду',
	overcast: 'облачную погоду',
	snow: 'снегопад',
	blizzard: 'метель',
	fog: 'туман',
	aurora: 'сияние'
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
	uncommon: 'НЕОБЫЧНАЯ',
	rare: 'РЕДКАЯ',
	mythic: 'МИФИЧЕСКАЯ'
}

export interface HelpPage {
	id: HelpPageId
	title: string
	lines: readonly string[]
}

/**
 * The four lessons of the manual, in the order a round teaches them.
 *
 * The ids are saved in the progress document (`lessons`), so they are a
 * compatibility surface like the area ids: never rename one.
 */
export const HELP_PAGE_IDS = ['cast', 'fight', 'counter', 'land'] as const

export type HelpPageId = (typeof HELP_PAGE_IDS)[number]

/** True for an id a saved document may carry; unknown junk is dropped on load. */
export function isHelpPageId(value: unknown): value is HelpPageId {
	return typeof value === 'string' && (HELP_PAGE_IDS as readonly string[]).includes(value)
}

/**
 * The manual, as four short lessons: one step of a round each, three or four
 * lines of copy and one still of the real UI. The copy is deliberately terse —
 * a popup the player opens mid-session is read, not studied — but every line
 * carries a rule the game actually enforces.
 *
 * Colours are written into the copy (see `ui/richCopy.ts`): `[ЛКМ]` marks a
 * control and is painted in ice, `{слово}` marks the word the rule turns on and
 * is painted in amber. They are the two things a player scanning the lesson
 * needs, and the escape bar — the fight's one silent rule — is explained in
 * words precisely because it has no label on screen.
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
			'Зажми [ЛКМ] или [Пробел] и отпусти в {зеленой зоне}.',
			'{Зеленая зона} повышает шанс на редкую рыбу.',
			'Подсекай сразу, как появится {«!»}.'
		]
	},
	{
		id: 'fight',
		title: 'БОРЬБА',
		lines: [
			'Держи рыбу {внутри круга}: зажми [ЛКМ] и веди против ее хода.',
			'Синяя шкала — твоя {выносливость}, под ней — {шкала срыва}, шкала под рыбой — ее {выносливость}.',
			'Зажимая [ЛКМ] тратится {выносливость} рыбы и твоя.',
			'Когда {шкала срыва} заполняется, рыба срывается вне зависимости сколько у нее {выносливости}.'
		]
	},
	{
		id: 'counter',
		title: 'КОНТРРЫВОК',
		lines: [
			'Как только появляется {красная зона} — зажми в ней [ЛКМ], потяни к центру и отпусти.',
			'{Красная} зона — куда рыба сделает рывок, {фиолетовый} — обманка.',
			'Проведя удачный контррывок, {шкала срыва} уменьшится.',
			'Пропуск рывка заполняет значительную часть {шкалы срыва}.'
		]
	},
	{
		id: 'land',
		title: 'ПОИМКА',
		lines: [
			'Когда появляется {золотой круг} у поплавка, значит рыба устала: жми [ПКМ] или [F].',
			'Или жди, пока {выносливость} дойдет до нуля — выловится сама.'
		]
	}
]

/**
 * The same four lessons for a finger: the rules are word-for-word the desktop
 * ones, and only the control changes — the stick, the cast chip and the landing
 * chip replace [ЛКМ], [Пробел], [ПКМ] and [F]. Controls stay in ice brackets and
 * the words the rules turn on stay in amber braces, exactly as above, so the two
 * manuals read as one document.
 */
const HELP_PAGES_TOUCH: readonly HelpPage[] = [
	{
		id: 'cast',
		title: 'ЗАБРОС',
		lines: [
			'Зажми [«ЗАБРОСИТЬ»] и отпусти в {зеленой зоне}.',
			'{Зеленая зона} повышает шанс на редкую рыбу.',
			'Подсекай сразу: жми [стик], как появится {«!»}.'
		]
	},
	{
		id: 'fight',
		title: 'БОРЬБА',
		lines: [
			'Держи рыбу {внутри круга}: зажми [стик] и веди против ее хода.',
			'Синяя шкала — твоя {выносливость}, под ней — {шкала срыва}, шкала под рыбой — ее {выносливость}.',
			'Зажимая [стик] тратится {выносливость} рыбы и твоя.',
			'Когда {шкала срыва} заполняется, рыба срывается вне зависимости сколько у нее {выносливости}.'
		]
	},
	{
		id: 'counter',
		title: 'КОНТРРЫВОК',
		lines: [
			'Как только появляется {красная зона} — зажми в ней [стик], потяни к центру и отпусти.',
			'{Красная} зона — куда рыба сделает рывок, {фиолетовый} — обманка.',
			'Проведя удачный контррывок, {шкала срыва} уменьшится.',
			'Пропуск рывка заполняет значительную часть {шкалы срыва}.'
		]
	},
	{
		id: 'land',
		title: 'ПОИМКА',
		lines: [
			'Когда появляется {золотой круг} у поплавка, значит рыба устала: жми [«ПОЙМАТЬ»].',
			'Или жди, пока {выносливость} дойдет до нуля — выловится сама.'
		]
	}
]

/** The manual for the input the player has in their hands. */
export function helpPages(touch: boolean): readonly HelpPage[] {
	return touch ? HELP_PAGES_TOUCH : HELP_PAGES
}

/**
 * The lesson a round opens when a mechanic comes up: the manual page of that
 * mechanic, word for word.
 *
 * The note used to carry its own, shorter copy, and the two drifted apart — the
 * corner said one thing and «Как играть» another. A player who reads one should
 * never have to unlearn the other, so the corner note now serves the manual's
 * lines and sizes itself to them.
 */
export function tutorialHint(touch: boolean, id: HelpPageId): HelpPage {
	const pages = helpPages(touch)
	return pages.find((page) => page.id === id) ?? pages[0]
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
		/** Third line of a catch tag: the fish wore the shiny coat. */
		shinyCatch: 'РЕДКАЯ ОКРАСКА',
		catchFeedback: (name: string, weight: string): string =>
			`${name.toUpperCase()}\n${weight} ${KG}`,
		/** Catch tag of a pearl: the flaw is the number hunters compare. */
		pearlFeedback: (name: string, flaw: string, size: string): string =>
			`ЖЕМЧУГ «${name.toUpperCase()}»\nИНДЕКС ${flaw} · ${size} ММ`,
		newPearl: 'НОВЫЙ СОРТ'
	},
	/** Labels of the travel cards between water bodies. */
	areas: {
		/** Stands in for the name of a water body the host has closed. */
		closed: 'НЕДОСТУПНО'
	},
	/** Sky rail at the bottom of the round: its caption and the live front's. */
	forecast: {
		/** Names the widget, in the panel's left-hand label block. */
		title: 'ПОГОДА',
		now: 'СЕЙЧАС'
	},
	codex: {
		title: 'СПРАВОЧНИК',
		window: 'ОКНО',
		weather: 'ПОГОДА',
		anytime: 'КРУГЛОСУТОЧНО',
		anyWeather: 'ЛЮБАЯ',
		/**
		 * The stat block under the blurb: one fact per row, a muted label and a
		 * bright value. The two weight rows read "current / the species' bound", so
		 * a row says both what the player has and how far the species itself allows.
		 */
		weightLowLabel: 'САМАЯ МЕЛКАЯ:',
		weightLowValue: (current: string, floor: string): string => `${current} / ${floor} КГ`,
		weightHighLabel: 'САМАЯ КРУПНАЯ:',
		weightHighValue: (current: string, ceiling: string): string => `${current} / ${ceiling} КГ`,
		caughtLabel: 'ПОЙМАНО:',
		caughtValue: (caught: number, target: number): string => `${caught} / ${target}`,
		slotCount: (caught: number): string => `x${caught}`,
		/** Shown instead of the name and the notes until the first catch. */
		unknown: '???',
		locked: 'ЕЩЕ НЕ ПОЙМАНА.\nЗАПИСЬ ОТКРОЕТСЯ ПОСЛЕ ПОИМКИ.',
		/** The fourth tab: pearls are their own collection, not a water body. */
		pearlTab: 'ЖЕМЧУГ',
		/**
		 * A pearl's rarity line is its band alone: every pearl is legendary, so the
		 * word was the same on every card and only took the place of the one thing
		 * that differs — how clean the specimen is.
		 */
		pearlType: (band: string): string => band,
		/**
		 * Footer rows of a pearl: the flaw index with the rule it obeys, the size
		 * against the variety's largest specimen, and how many were found.
		 */
		pearlIndexLabel: 'ИНДЕКС:',
		pearlSizeLabel: 'РАЗМЕР:',
		pearlSizeValue: (size: string, largest: string): string => `${size} / ${largest} ММ`,
		pearlFoundLabel: 'НАЙДЕНО:',
		pearlLocked: 'ЕЩЕ НЕ НАЙДЕНА.\nЗАПИСЬ ОТКРОЕТСЯ ПОСЛЕ ПОИМКИ.'
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

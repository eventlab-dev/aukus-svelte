import type { ZoneTuning } from '../game/fight/zoneTuning'

/**
 * The copy and the knob table of the `F8` zone tuner.
 *
 * Kept out of the panel because they are a table, not a drawing — the same split
 * the sky inspector uses (`devWaterRows.ts`): each row knows which number it
 * edits, how it prints it and how it explains itself in one sentence. The copy
 * is dev-only, so it lives with the panel instead of in `texts.ts`, which is the
 * player's text.
 */

/** Everything the panel says, in one place. */
export const ZONE_TEXT = {
	title: 'ЗОНЫ РЫВКА · DEV',
	hint: 'F8 / ESC — ЗАКРЫТЬ · ПОЛЗУНКИ МЕНЯЮТ БОЙ СРАЗУ',
	honest: 'ЧЕСТНЫЙ',
	feint: 'ФИНТ',
	blocked: 'КОНТР',
	pause: 'ПАУЗА',
	play: 'ЖИВО',
	rimSide: 'ГДЕ ОБВОДКА',
	rimInside: 'ВНУТРИ',
	rimOutside: 'СНАРУЖИ',
	lockCaption: 'ЗАМОК КОНТРА',
	lockWhere: 'ГДЕ ЗАМОК',
	lockOnFloat: 'НА ПОПЛАВКЕ',
	lockOnFish: 'НА РЫБЕ',
	cueCaption: 'КОЛЬЦО КОНТРА',
	idle: 'НАВЕДИ НА ПОЛЗУНОК — РАССКАЖУ, ЧТО ОН МЕНЯЕТ.\nЛКМ ПО ЗОНЕ — ПРОВЕРИТЬ КОНТР.',
	hit: 'КОНТР ЗАСЧИТАН',
	prepared: 'ЗАГОТОВЛЕНО: ЗАСЧИТАЕТСЯ, КОГДА ОТКРОЕТСЯ ОКНО',
	miss: 'МИМО: НАЖАТИЕ ВНЕ ПОЛОСЫ',
	late: 'ПОЗДНО: РЫВОК УЖЕ КОНЧИЛСЯ'
} as const

/** Every knob that is a number: the toggles are buttons, not faders. */
export type ZoneNumberKey = Exclude<keyof ZoneTuning, 'rimOutside' | 'lockAtFloat'>

/** One slider of the column: what it edits, how it reads, how it explains itself. */
export interface ZoneRow {
	key: ZoneNumberKey
	label: string
	help: string
	min: number
	max: number
	/** Smallest change a drag can make: what the readout prints. */
	step: number
	format: (value: number) => string
}

const percent = (value: number): string => `${Math.round(value * 100)}%`
const seconds = (value: number): string => `${value.toFixed(2)} с`
const degrees = (value: number): string => `${value.toFixed(1)}°`
const pixels = (value: number): string => `${value.toFixed(1)} px`

/**
 * The numbers of a zone, in the order they act on it: when it appears and
 * leaves, how the blocked grey comes in, where the band sits and how big it is,
 * the feint spread, the pause between bursts, and finally the paint.
 *
 * All percentages are 0..100, all times are seconds and start at zero, angles
 * are degrees, thicknesses are pixels.
 */
export const ZONE_ROWS: readonly ZoneRow[] = [
	{
		key: 'fadeIn',
		label: 'ФЕЙД-ИН',
		help: 'ЗА СКОЛЬКО СЕКУНД ЗОНА ПРОЯВЛЯЕТСЯ, КОГДА РЫВОК НАЧАЛСЯ. 0 — МГНОВЕННО.',
		min: 0,
		max: 2,
		step: 0.01,
		format: seconds
	},
	{
		key: 'fadeOut',
		label: 'ФЕЙД-АУТ',
		help: 'ЗА СКОЛЬКО СЕКУНД ОНА ГАСНЕТ, КОГДА РЫВОК КОНЧИЛСЯ.',
		min: 0,
		max: 3,
		step: 0.01,
		format: seconds
	},
	{
		key: 'delay',
		label: 'ЗАДЕРЖКА',
		help: 'НА СКОЛЬКО ПОЗЖЕ ЛОЖНОЙ ПОЯВЛЯЕТСЯ НАСТОЯЩАЯ ЗОНА ФИНТА.',
		min: 0,
		max: 2,
		step: 0.01,
		format: seconds
	},
	{
		key: 'truthTime',
		label: 'ДЛИТ. ИСТИНЫ',
		help: 'СКОЛЬКО СЕКУНД НАСТОЯЩАЯ ЗОНА ВИДНА; ВСЁ ЭТО ВРЕМЯ ОКНО КОНТРА ОТКРЫТО.',
		min: 0.1,
		max: 2,
		step: 0.01,
		format: seconds
	},
	{
		key: 'lieTime',
		label: 'ДЛИТ. ЛЖИ',
		help: 'СКОЛЬКО СЕКУНД ВИДНА ЛОЖНАЯ ЗОНА ФИНТА.',
		min: 0.1,
		max: 2,
		step: 0.01,
		format: seconds
	},
	{
		key: 'greyTime',
		label: 'СЕРЫЙ',
		help: 'ЗА СКОЛЬКО СЕКУНД ЗОНА, ПО КОТОРОЙ ПРОШЁЛ КОНТР, УХОДИТ В СЕРЫЙ.',
		min: 0,
		max: 2,
		step: 0.01,
		format: seconds
	},
	{
		key: 'grabArc',
		label: 'ШИРИНА',
		help: 'ПОЛУУГОЛ ЗОНЫ: НА СКОЛЬКО ГРАДУСОВ ОНА РАСХОДИТСЯ ОТ КУРСА РЫВКА.',
		min: 5,
		max: 45,
		step: 0.5,
		format: degrees
	},
	{
		key: 'distance',
		label: 'РАССТОЯНИЕ',
		help: 'НА СКОЛЬКО ПИКСЕЛЕЙ ВНУТРЕННИЙ КРАЙ ЗОНЫ ОТСТОИТ ОТ ЦЕНТРА КРУГА.',
		min: 5,
		max: 60,
		step: 0.5,
		format: pixels
	},
	{
		key: 'grabDepth',
		label: 'ВЫСОТА',
		help: 'ГЛУБИНА ЗОНЫ ОТ ЕЁ ВНУТРЕННЕГО КРАЯ НАРУЖУ, В ПИКСЕЛЯХ.',
		min: 5,
		max: 40,
		step: 0.5,
		format: pixels
	},
	{
		key: 'spreadMin',
		label: 'РАЗБРОС МИН',
		help: 'МИНИМАЛЬНЫЙ ЗАЗОР МЕЖДУ КРАЯМИ ЛОЖНОЙ И НАСТОЯЩЕЙ ЗОНЫ. 0 — КРАЯ КАСАЮТСЯ.',
		min: 0,
		max: 180,
		step: 0.5,
		format: degrees
	},
	{
		key: 'spreadMax',
		label: 'РАЗБРОС МАКС',
		help: 'МАКСИМАЛЬНЫЙ ЗАЗОР МЕЖДУ КРАЯМИ ЛОЖНОЙ И НАСТОЯЩЕЙ ЗОНЫ.',
		min: 0,
		max: 180,
		step: 0.5,
		format: degrees
	},
	{
		key: 'dashGap',
		label: 'ПАУЗА МЕЖДУ РЫВКАМИ',
		help: 'МИНИМАЛЬНАЯ ТИШИНА МЕЖДУ РЫВКАМИ: ЭТО ЖЕ ПАУЗА ПЕРЕД ПОВТОРОМ В ПРЕВЬЮ.',
		min: 0,
		max: 3,
		step: 0.01,
		format: seconds
	},
	{
		key: 'fill',
		label: 'ЗАЛИВКА',
		help: 'ПЛОТНОСТЬ ЗАЛИВКИ ВНУТРИ ЗОНЫ.',
		min: 0,
		max: 1,
		step: 0.01,
		format: percent
	},
	{
		key: 'rim',
		label: 'ОБВОДКА',
		help: 'ПЛОТНОСТЬ ОБВОДКИ; ГДЕ ОНА ЛЕЖИТ — ВНУТРИ ИЛИ СНАРУЖИ — ВЫБИРАЕТСЯ НИЖЕ.',
		min: 0,
		max: 1,
		step: 0.01,
		format: percent
	},
	{
		key: 'rimWidth',
		label: 'ЖИРНОСТЬ',
		help: 'ТОЛЩИНА ОБВОДКИ В ПИКСЕЛЯХ.',
		min: 0.5,
		max: 4,
		step: 0.5,
		format: pixels
	}
]

/** The counter's own numbers, shown on the second tab. */
export const COUNTER_ROWS: readonly ZoneRow[] = [
	{
		key: 'counterDrag',
		label: 'ПРОТЯЖКА',
		help: 'СКОЛЬКО ПИКСЕЛЕЙ НУЖНО ПРОТАЩИТЬ К ЦЕНТРУ, ЧТОБЫ ЗАХВАТ ЗАСЧИТАЛСЯ.',
		min: 2,
		max: 30,
		step: 0.5,
		format: pixels
	},
	{
		key: 'counterRest',
		label: 'ОТДЫХ',
		help: 'СКОЛЬКО СЕКУНД НЕ ДЕРЖАТЬ КНОПКУ НА ТЕЛЕГРАФЕ, ЧТОБЫ ЗАХВАТ ВЗВЁЛСЯ БЕЗ НОВОГО НАЖАТИЯ.',
		min: 0,
		max: 0.5,
		step: 0.01,
		format: seconds
	},
	{
		key: 'counterStun',
		label: 'СТАН',
		help: 'СКОЛЬКО СЕКУНД РЫБА ВИСИТ ОГЛУШЁННОЙ ПОСЛЕ ПОЙМАННОГО КОНТРА.',
		min: 0.1,
		max: 1,
		step: 0.01,
		format: seconds
	}
]

/** The padlock's own numbers: the mark that seals a landed counter. */
export const LOCK_ROWS: readonly ZoneRow[] = [
	{
		key: 'lockTime',
		label: 'ВРЕМЯ',
		help: 'СКОЛЬКО СЕКУНД ГОРИТ ЗАМОК ПОСЛЕ ПОЙМАННОГО КОНТРА; ОН ЖЕ ГАСНЕТ ЭТО ВРЕМЯ.',
		min: 0.1,
		max: 1.5,
		step: 0.01,
		format: seconds
	},
	{
		key: 'lockScale',
		label: 'РАЗМЕР',
		help: 'ВО СКОЛЬКО РАЗ КРУПНЕЕ ЗАМОК: ЦЕЛЫЕ ПИКСЕЛИ, ЧТОБЫ ОН ОСТАЛСЯ ЧЁТКИМ.',
		min: 0.5,
		max: 3,
		step: 0.5,
		format: (value) => `×${value.toFixed(1)}`
	},
	{
		key: 'lockLift',
		label: 'ВЫСОТА',
		help: 'НА СКОЛЬКО ПИКСЕЛЕЙ ЗАМОК ПОДНЯТ НАД ТОЧКОЙ ПРИВЯЗКИ; МИНУС — ВЫШЕ.',
		min: -16,
		max: 8,
		step: 1,
		format: pixels
	}
]

/** The receipt ring of a landed counter, around the float. */
export const CUE_ROWS: readonly ZoneRow[] = [
	{
		key: 'cueSize',
		label: 'РАДИУС',
		help: 'С КАКОГО РАДИУСА КОЛЬЦО КОНТРА НАЧИНАЕТСЯ ВОКРУГ ПОПЛАВКА.',
		min: 4,
		max: 24,
		step: 0.5,
		format: pixels
	},
	{
		key: 'cueGrow',
		label: 'РОСТ',
		help: 'НА СКОЛЬКО ПИКСЕЛЕЙ КОЛЬЦО РАСХОДИТСЯ, ПОКА ДЛИТСЯ СТАН.',
		min: 0,
		max: 24,
		step: 0.5,
		format: pixels
	}
]

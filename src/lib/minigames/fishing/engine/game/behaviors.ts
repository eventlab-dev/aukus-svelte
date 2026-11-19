import type { FishSpecies } from '../config'

export type DashDir = 'away' | 'toward' | 'flip' | 'same'

export type MoveKind = 'pause' | 'dash' | 'arc' | 'wave' | 'zigzag'

/**
 * One beat of a fish's movement script. Directions are resolved at runtime
 * against the player's pull, so the same script reads differently depending
 * on where the player is pulling.
 *
 * - `away`   — bolts against the rod, away from the pull
 * - `toward` — gives in and shoots along the pull for a beat
 * - `flip`   — the opposite edge from the previous dash
 * - `same`   — repeat the previous dash edge
 */
export interface Move {
	kind: MoveKind
	dir?: DashDir
	dur: number
	/** Strong moves warn the player with a flash and an arrow first. */
	strong?: boolean
	/** Wave / zigzag amplitude as a fraction of the column. */
	amplitude?: number
	/** Full sine cycles for `wave`. */
	cycles?: number
	/** Target changes for `zigzag`. */
	count?: number
}

const pause = (dur: number): Move => ({ kind: 'pause', dur })
const dash = (dir: DashDir, dur: number, strong = false): Move => ({
	kind: 'dash',
	dir,
	dur,
	strong
})
const arc = (dir: DashDir, dur: number, strong = false): Move => ({
	kind: 'arc',
	dir,
	dur,
	strong
})
const wave = (dur: number, amplitude: number, cycles = 1): Move => ({
	kind: 'wave',
	dur,
	amplitude,
	cycles
})
const zigzag = (count: number, dur: number, amplitude = 0.28): Move => ({
	kind: 'zigzag',
	dur,
	count,
	amplitude
})

/**
 * Species scripts, keyed by `FishSpecies.behavior`. They are deliberately
 * short and loop forever: each fish keeps re-reading the player's position.
 *
 * Every cycle gives the player at least one clear recovery beat: dashing
 * without a pause is what used to make some fish impossible.
 *
 * `strong` is the telegraphed, counterable beat. Every rare and legendary fish
 * carries at least one, and so do the big predatory commons; schooling, tiny
 * and slow/round fish stay quiet on purpose — their fight is the tug, not the
 * read. `validateFishData` enforces the tier half of that rule, and the area
 * half (each water teaches the counter at least twice).
 */
const SCRIPTS: Record<string, () => Move[]> = {
	// Широкая дуга, короткий прямой рывок и пауза.
	bluegill: () => [arc('away', 1.1), dash('away', 0.3), pause(0.55)],
	// Два быстрых противоположных рывка, затем отдых.
	capelin: () => [dash('flip', 0.26), pause(0.35), dash('same', 0.26), pause(0.8)],
	// Три коротких рывка в разные стороны и длинное затишье.
	sardine: () => [
		dash('flip', 0.24),
		pause(0.18),
		dash('flip', 0.24),
		pause(0.18),
		dash('flip', 0.24),
		pause(1)
	],
	// Рывок вбок, пауза, прямой рывок от рыбака.
	flounder: () => [dash('flip', 0.3), pause(0.4), dash('away', 0.35), pause(0.7)],
	// Плавные широкие дуги и короткий рывок.
	tilapia: () => [arc('away', 1), arc('toward', 0.8), pause(0.45), dash('away', 0.3)],
	// Широкие дуги, два рывка и долгое затишье.
	carp: () => [
		arc('away', 1),
		arc('toward', 0.8),
		pause(0.4),
		dash('away', 0.32),
		dash('toward', 0.3),
		pause(0.9)
	],
	// Короткий рывок вбок, движение по кривой и пауза.
	angelfish: () => [dash('flip', 0.22), arc('flip', 0.9), pause(0.5), dash('away', 0.3, true)],
	// Широкие боковые движения, затем сильный рывок.
	largemouthbass: () => [
		arc('toward', 0.9),
		arc('away', 0.9),
		dash('away', 0.5, true),
		pause(0.65)
	],
	// Рывок, кривая и сильный прямой рывок.
	chub: () => [dash('flip', 0.24), arc('flip', 0.6), dash('away', 0.52, true), pause(0.6)],
	// Два диагональных рывка и восстановление.
	smallmouthbass: () => [dash('away', 0.32), pause(0.3), dash('flip', 0.32, true), pause(0.7)],
	// Сильный рывок вбок, волна и пауза.
	rainbowtrout: () => [dash('flip', 0.4, true), wave(0.8, 0.22, 1), pause(0.6)],
	// Сильный уход от рыбака и две волны.
	cod: () => [dash('away', 0.8, true), wave(0.9, 0.2, 1), wave(0.9, 0.2, 1), pause(0.6)],
	// Долгое затишье, затем короткий сильный рывок.
	walleye: () => [pause(1.2), dash('flip', 0.3, true), pause(0.7)],
	// Два тяжелых рывка в противоположные стороны и долгий отдых.
	catfish: () => [dash('away', 0.62, true), pause(0.5), dash('toward', 0.58, true), pause(1.1)],
	// Рывки по траектории в форме буквы S, затем короткий рывок.
	eel: () => [wave(1.2, 0.38, 2), pause(0.4), dash('flip', 0.3, true), pause(0.5)],
	// Медленная широкая волна, затем рывок за пределы круга.
	grouper: () => [wave(1.6, 0.34, 1.3), pause(0.45), dash('away', 0.35)],
	// Два резких рывка вбок и пауза.
	redsnapper: () => [dash('flip', 0.28), pause(0.3), dash('flip', 0.28), pause(0.6)],
	// Затишье, тяжелый рывок, снова затишье.
	lionfish: () => [
		pause(0.5),
		dash('away', 0.62, true),
		pause(0.55),
		dash('toward', 0.58, true),
		pause(0.55)
	],
	// Два длинных прямых выпада с паузами.
	tuna: () => [dash('away', 1.06, true), pause(0.5), dash('toward', 0.96, true), pause(0.8)],
	// Один длинный мощный рывок, отдых и короткий ответный.
	sturgeon: () => [dash('away', 0.82, true), pause(0.6), dash('toward', 0.42, true), pause(0.5)],
	// Мелкая стайка: короткие броски и зигзаг.
	minnow: () => [dash('flip', 0.18), pause(0.25), zigzag(3, 0.5, 0.22), pause(0.45)],
	// Полосатый хищник: дуга, пауза и короткий бросок.
	perch: () => [arc('away', 0.8), pause(0.25), dash('flip', 0.28), pause(0.55)],
	// Щука бьет из засады длинным прямым рывком.
	pike: () => [pause(0.45), dash('away', 0.55, true), pause(0.4), arc('flip', 0.7)],
	// Кои ходит широко и тяжело, но финальный рывок сильный.
	koi: () => [arc('away', 1.2), arc('toward', 1), pause(0.7), dash('away', 0.3, true), pause(0.9)],
	// Лосось идет против течения волной и срывается в рывок.
	salmon: () => [wave(1, 0.25, 1), dash('away', 0.6, true), pause(0.7)],
	// Прыгун мечется зигзагом и замирает.
	mudskipper: () => [zigzag(4, 0.7, 0.3), pause(0.45), dash('flip', 0.24)],
	// Тигровая рыба: резкий бросок вбок и мощный прямой.
	tigerfish: () => [dash('flip', 0.3), pause(0.2), dash('away', 0.5, true), pause(0.6)],
	// Барракуда — один стремительный прямой рывок.
	barracuda: () => [dash('away', 0.55, true), pause(0.3), dash('flip', 0.28), pause(0.7)],
	// Бабочка ходит мягкими дугами.
	butterflyfish: () => [arc('flip', 0.7), pause(0.3), arc('away', 0.7), pause(0.5)],
	// Клоун: короткие броски в укрытие и зигзаг.
	clownfish: () => [dash('flip', 0.22), pause(0.22), zigzag(3, 0.6, 0.22), pause(0.5)],
	// Палтус тяжело идет волной и тянет ко дну.
	halibut: () => [wave(1.4, 0.3, 1), pause(0.5), dash('toward', 0.4, true)],
	// Марлин — два длинных сильных выпада.
	marlin: () => [dash('away', 1, true), pause(0.4), dash('toward', 0.9, true), pause(0.8)],
	// Сельдяной король — длинная змеистая лента.
	oarfish: () => [wave(1.8, 0.42, 1.5), dash('away', 0.8, true), pause(1)],
	// Меч-рыба: резкий боковой удар и мощный уход.
	swordfish: () => [dash('flip', 0.5, true), pause(0.35), dash('away', 0.7, true), pause(0.7)]
}

/** True when a fish's `behavior` key has a dedicated movement script. */
export function hasBehaviorScript(id: string): boolean {
	return id in SCRIPTS
}

const FALLBACK: Move[] = [
	dash('flip', 0.35),
	pause(0.5),
	arc('away', 1),
	zigzag(3, 0.9),
	pause(0.8)
]

export function buildScript(fish: FishSpecies): Move[] {
	const factory = SCRIPTS[fish.behavior]
	if (factory) return factory()
	return FALLBACK
}

/**
 * True when the species' script contains a telegraphed, counterable dash.
 * A quiet species is a deliberate fight variant, not a missing script.
 */
export function hasStrongDash(id: string): boolean {
	const factory = SCRIPTS[id]
	const script = factory ? factory() : FALLBACK
	return script.some((move) => move.strong === true)
}

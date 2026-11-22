/**
 * Balance probe for the fishing roll: prints the tables the codebase is tuned
 * against, using the shipped modules rather than a copy of their formula.
 *
 * Run it after touching `TIER_WEIGHTS`, the rosters or the pity:
 *
 * ```sh
 * npm run balance
 * ```
 *
 * The script bundles this entry with Vite (the only bundler the repository
 * already has) into a temp folder and imports it, so the source can stay a
 * normal `.ts` module with ordinary imports.
 */
import { FISH } from '../src/lib/minigames/fishing/engine/fish/roster'
import {
	TIER_SHARE,
	TIER_SHINY,
	TIER_WEIGHTS
} from '../src/lib/minigames/fishing/engine/fish/tiers'
import {
	fishInArea,
	hasGates,
	isFishInWindow
} from '../src/lib/minigames/fishing/engine/fish/activity'
import { validateFishData } from '../src/lib/minigames/fishing/engine/fish/validate'
import { pearlBand, rollPearl } from '../src/lib/minigames/fishing/engine/fish/pearls'
import {
	LUCK_ZONE_MULT,
	LUCK_ZONE_SHINY,
	PEARL,
	type FishSpecies
} from '../src/lib/minigames/fishing/engine/config'
import {
	hasBehaviorScript,
	hasStrongDash
} from '../src/lib/minigames/fishing/engine/game/behaviors'
import {
	castWeight,
	pickCastFish,
	pityMultiplier,
	PITY_FROM,
	PITY_MAX,
	type CastPickContext
} from '../src/lib/minigames/fishing/engine/game/castPick'
import { formatClock } from '../src/lib/minigames/fishing/engine/utils'
import type { AreaId, FishTier, WeatherId } from '../src/lib/minigames/fishing/engine/types'
import { nextWeather, WEATHER_IDS } from '../src/lib/minigames/fishing/engine/world/weather'

const TIERS: readonly FishTier[] = ['common', 'uncommon', 'rare', 'mythic']
const AREA_IDS: readonly AreaId[] = ['deep', 'rapids', 'cove']
const ROLLS = 200_000
const PEARL_ROLLS = 100_000
const EVERY_FISH: ReadonlySet<string> = new Set(FISH.map((fish) => fish.id))

function pct(value: number): string {
	if (value < 0.001) return `${(value * 100).toFixed(4)}%`
	if (value < 0.1) return `${(value * 100).toFixed(3)}%`
	return `${(value * 100).toFixed(2)}%`
}

function pad(text: string, width: number): string {
	return text.padEnd(width, ' ')
}

function ratio(value: number): string {
	return `x${value.toFixed(3)}`
}

function tierPool(areaId: AreaId, mode: 'base' | 'bonus'): number {
	return fishInArea(areaId).reduce((sum, fish) => sum + TIER_WEIGHTS[fish.tier][mode], 0)
}

/**
 * How the sky spends its time: the Markov chain in `nextWeather`, sampled one
 * minute at a time so the night-only aurora rule applies exactly as it does in
 * the clock. The clock is uniform over the day, so this mix doubles as the
 * weather weight of every minute in the daily tables below.
 */
function weatherMix(): Map<WeatherId, number> {
	const steps = 400_000
	const counts = new Map<WeatherId, number>()
	for (const id of WEATHER_IDS) counts.set(id, 0)
	let current: WeatherId = WEATHER_IDS[0]
	let minute = 0
	for (let i = 0; i < steps; i += 1) {
		minute = (minute + 1) % 1440
		current = nextWeather(current, minute)
		counts.set(current, (counts.get(current) ?? 0) + 1)
	}
	const mix = new Map<WeatherId, number>()
	for (const [id, count] of counts) mix.set(id, count / steps)
	return mix
}

interface SpeciesOdds {
	fish: FishSpecies
	/** Share of the day the species is in its window (clock × weather). */
	windowShare: number
	plain: number
	zone: number
}

/**
 * Average chance per bite over 24 hours, integrated exactly: every minute ×
 * every front, weighted by how long that front lasts. No pity (that is a
 * per-player state, printed separately).
 */
function dailyOdds(areaId: AreaId, mix: Map<WeatherId, number>): SpeciesOdds[] {
	const roster = fishInArea(areaId)
	const plain = new Map<string, number>()
	const zone = new Map<string, number>()
	const windowShare = new Map<string, number>()
	for (const fish of roster) {
		plain.set(fish.id, 0)
		zone.set(fish.id, 0)
		windowShare.set(fish.id, 0)
	}
	for (let minutes = 0; minutes < 1440; minutes += 1) {
		for (const weather of WEATHER_IDS) {
			const weight = (mix.get(weather) ?? 0) / 1440
			if (weight === 0) continue
			const plainCtx: CastPickContext = {
				areaId,
				minutes,
				weather,
				luckZoneHit: false,
				catchesOnLocation: 0,
				caught: EVERY_FISH
			}
			const zoneCtx: CastPickContext = { ...plainCtx, luckZoneHit: true }
			const plainWeights = roster.map((fish) => castWeight(fish, plainCtx))
			const zoneWeights = roster.map((fish) => castWeight(fish, zoneCtx))
			const plainPool = plainWeights.reduce((sum, value) => sum + value, 0)
			const zonePool = zoneWeights.reduce((sum, value) => sum + value, 0)
			roster.forEach((fish, index) => {
				plain.set(fish.id, (plain.get(fish.id) ?? 0) + (weight * plainWeights[index]) / plainPool)
				zone.set(fish.id, (zone.get(fish.id) ?? 0) + (weight * zoneWeights[index]) / zonePool)
				if (hasGates(fish) && isFishInWindow(fish, minutes, weather)) {
					windowShare.set(fish.id, (windowShare.get(fish.id) ?? 0) + weight)
				}
			})
		}
	}
	return roster.map((fish) => ({
		fish,
		windowShare: windowShare.get(fish.id) ?? 0,
		plain: plain.get(fish.id) ?? 0,
		zone: zone.get(fish.id) ?? 0
	}))
}

function windowLabel(fish: FishSpecies): string {
	if (!fish.windows || fish.windows.length === 0) return '—'
	return fish.windows
		.map((window) => `${formatClock(window.from)}-${formatClock(window.to)}`)
		.join(' ')
}

function weatherLabel(fish: FishSpecies): string {
	if (!fish.weather || fish.weather.length === 0) return 'любая'
	return fish.weather.join('/')
}

function printMatrix(): void {
	console.log('\n== Матрица классов (fish/tiers.ts) ==')
	console.log(pad('класс', 10) + pad('base', 8) + pad('bonus', 8) + pad('шайни', 9) + 'доля видов')
	for (const tier of TIERS) {
		const weights = TIER_WEIGHTS[tier]
		const share = TIER_SHARE[tier]
		console.log(
			pad(tier, 10) +
				pad(String(weights.base), 8) +
				pad(String(weights.bonus), 8) +
				pad(pct(TIER_SHINY[tier]), 9) +
				`${pct(share[0])}..${pct(share[1])}`
		)
	}
	console.log(
		'виды: ' +
			TIERS.map((tier) => `${tier} ${FISH.filter((fish) => fish.tier === tier).length}`).join(', ')
	)
	console.log('погода: ' + [...weatherMix()].map(([id, share]) => `${id} ${pct(share)}`).join(', '))
}

function printValidation(): void {
	console.log('\n== validateFishData ==')
	const problems = validateFishData(hasBehaviorScript, hasStrongDash)
	if (problems.length === 0) {
		console.log('  ok: 40 видов, три водоёма, четыре класса')
		return
	}
	for (const problem of problems) console.log(`  ! ${problem}`)
}

function printAnalytic(): void {
	console.log('\n== Доля поклёвки на вид: все в окне / все вне окна, без pity ==')
	for (const areaId of AREA_IDS) {
		const roster = fishInArea(areaId)
		for (const mode of ['base', 'bonus'] as const) {
			const pool = tierPool(areaId, mode)
			const parts = TIERS.map((tier) => {
				const count = roster.filter((fish) => fish.tier === tier).length
				const weight = TIER_WEIGHTS[tier][mode]
				return `${pct(weight / pool)}/${pct((count * weight) / pool)}`
			})
			console.log(
				pad(areaId, 8) +
					pad(mode, 7) +
					`пул ${pool.toFixed(1)}  ` +
					parts.join('  ') +
					'   (на вид / на класс)'
			)
		}
	}
}

function printDaily(mix: Map<WeatherId, number>): void {
	console.log('\n== Средние шансы за сутки: каждый вид, без зоны / с зоной ==')
	console.log(
		`   (часы равномерны, погода по своей цепи Маркова; зона — попадание всегда; pity выключен)`
	)
	for (const areaId of AREA_IDS) {
		const odds = dailyOdds(areaId, mix)
		console.log(`\n[${areaId}]`)
		console.log(
			pad('вид', 16) +
				pad('класс', 10) +
				pad('время', 20) +
				pad('погода', 18) +
				pad('бонус', 9) +
				pad('без зоны', 10) +
				pad('с зоной', 10) +
				'эффект'
		)
		for (const tier of TIERS) {
			const rows = odds.filter((row) => row.fish.tier === tier).sort((a, b) => b.plain - a.plain)
			for (const row of rows) {
				console.log(
					pad(row.fish.id, 16) +
						pad(row.fish.tier, 10) +
						pad(windowLabel(row.fish), 20) +
						pad(weatherLabel(row.fish), 18) +
						pad(pct(row.windowShare), 9) +
						pad(pct(row.plain), 10) +
						pad(pct(row.zone), 10) +
						ratio(row.zone / row.plain)
				)
			}
		}
		const totals = TIERS.map((tier) => {
			const rows = odds.filter((row) => row.fish.tier === tier)
			return `${tier} ${pct(rows.reduce((sum, row) => sum + row.plain, 0))}→${pct(
				rows.reduce((sum, row) => sum + row.zone, 0)
			)}`
		})
		console.log('  итого по классам: ' + totals.join('  '))
	}
}

function printZoneMath(): void {
	console.log('\n== Как зона удачи меняет пул ==')
	console.log(
		`   LUCK_ZONE_MULT ${LUCK_ZONE_MULT}: вес не-common в окне умножается, пул растёт, поэтому выигрыш меньше ${ratio(
			LUCK_ZONE_MULT
		)}`
	)
	for (const areaId of AREA_IDS) {
		const roster = fishInArea(areaId)
		const pool = tierPool(areaId, 'bonus')
		const rarePool =
			pool - roster.filter((fish) => fish.tier === 'common').length * TIER_WEIGHTS.common.bonus
		const zonePool = pool + (LUCK_ZONE_MULT - 1) * rarePool
		console.log(
			pad(areaId, 8) +
				`не-common в окне ${pct(rarePool / pool)} пула, с зоной пул ${zonePool.toFixed(1)} -> ` +
				`не-common x${((LUCK_ZONE_MULT * pool) / zonePool).toFixed(3)}, common x${(pool / zonePool).toFixed(3)}`
		)
	}
	console.log(
		`   вне окна зона не работает (base не множится); шайни зона удваивает всегда: LUCK_ZONE_SHINY ${LUCK_ZONE_SHINY}`
	)
}

function printPity(): void {
	console.log('\n== Pity ==')
	for (const catches of [
		PITY_FROM,
		PITY_FROM + 20,
		PITY_FROM + 40,
		PITY_FROM + 60,
		PITY_FROM + 80,
		400
	]) {
		console.log(`  ${catches} уловов -> x${pityMultiplier(catches).toFixed(3)}`)
	}
	console.log(`  потолок x${PITY_MAX}`)
}

function printPearls(): void {
	console.log('\n== Жемчуг: износ, 100k бросков ==')
	for (const zone of [false, true]) {
		const bands = new Map<string, number>()
		for (let i = 0; i < PEARL_ROLLS; i += 1) {
			const pearl = rollPearl({ luckZoneHit: zone })
			const id = pearlBand(pearl.float).id
			bands.set(id, (bands.get(id) ?? 0) + 1)
		}
		const parts = ['chalky', 'matte', 'satin', 'glossy', 'mirror']
			.filter((id) => bands.has(id))
			.map((id) => `${id} ${pct((bands.get(id) ?? 0) / PEARL_ROLLS)}`)
		const mirror = (bands.get('mirror') ?? 0) / PEARL_ROLLS
		console.log(
			`  ${zone ? 'с зоной ' : 'без зоны'} ${parts.join('  ')}  -> зеркальный 1 на ${Math.round(
				1 / (mirror * PEARL.shellChance)
			)} забросов`
		)
	}
}

function printShiny(): void {
	console.log('\n== Шайни за поклёвку (не зависит от окна) ==')
	for (const tier of TIERS) {
		const plain = TIER_SHINY[tier]
		const zone = plain * LUCK_ZONE_SHINY
		console.log(
			pad(tier, 10) +
				`${pct(plain)} (медиана ${Math.round(Math.log(0.5) / Math.log(1 - plain))} уловов)   ` +
				`с зоной ${pct(zone)} (медиана ${Math.round(Math.log(0.5) / Math.log(1 - zone))})`
		)
	}
}

function printMonteCarlo(): void {
	console.log('\n== Монте-Карло, случайные час/погода, половина забросов в зоне ==')
	for (const areaId of AREA_IDS) {
		for (const [label, catches, caughtCount] of [
			['чистый сейв', 0, 0],
			['половина кодекса', 0, Math.floor(fishInArea(areaId).length / 2)],
			['потолок pity', 180, Math.floor(fishInArea(areaId).length / 2)]
		] as const) {
			const roster = fishInArea(areaId)
			const caught = new Set(roster.slice(0, caughtCount).map((fish) => fish.id))
			const counts: Record<FishTier, number> = { common: 0, uncommon: 0, rare: 0, mythic: 0 }
			for (let i = 0; i < ROLLS; i += 1) {
				const fish = pickCastFish({
					areaId,
					minutes: Math.floor(Math.random() * 1440),
					weather: WEATHER_IDS[Math.floor(Math.random() * WEATHER_IDS.length)],
					luckZoneHit: Math.random() < 0.5,
					catchesOnLocation: catches,
					caught
				})
				counts[fish.tier] += 1
			}
			const parts = TIERS.map((tier) => pct(counts[tier] / ROLLS))
			console.log(pad(areaId, 8) + pad(label, 18) + parts.join('  '))
		}
	}
}

const mix = weatherMix()
printMatrix()
printValidation()
printAnalytic()
printZoneMath()
printDaily(mix)
printPity()
printPearls()
printShiny()
printMonteCarlo()

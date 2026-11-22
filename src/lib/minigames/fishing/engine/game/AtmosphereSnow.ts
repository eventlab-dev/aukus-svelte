import { VIEW } from '../config'
import { clamp, randRange } from '../utils'
import { WINTER } from '../world'
import { AtmosphereSky } from './AtmosphereSky'
import { WEATHER_BLEND_SECONDS } from './AtmosphereBase'

export class AtmosphereSnow extends AtmosphereSky {
	protected smoothWeather(dt: number): void {
		if (!this.weatherReady) return
		const k = 1 - Math.exp(-dt / WEATHER_BLEND_SECONDS)
		const target = this.weather
		this.visual.snow += (target.snow - this.visual.snow) * k
		this.visual.gust += (target.gust - this.visual.gust) * k
		this.visual.fog += (target.fog - this.visual.fog) * k
		this.visual.dark += (target.dark - this.visual.dark) * k
		this.visual.cloud += (target.cloud - this.visual.cloud) * k
		this.visual.aurora += (target.aurora - this.visual.aurora) * k
	}

	/**
	 * Wind speed multiplier, 0..1.4, as a sum of three incommensurate waves.
	 *
	 * A constant push reads as a fan rather than as weather; a blizzard arrives
	 * in bursts, so the flakes are driven by this envelope instead of a fixed
	 * horizontal speed. The waves never repeat inside a session, which is what
	 * makes the gusts feel random without a timer.
	 */
	protected gustAt(time: number): number {
		const seed = this.gustSeed
		const value =
			0.5 +
			Math.sin(time * 0.41 + seed) * 0.28 +
			Math.sin(time * 1.27 + seed * 2.1) * 0.16 +
			Math.sin(time * 0.19 + seed * 3.7) * 0.22
		return clamp(value, 0.05, 1.4)
	}

	protected drawSnow(dt: number): void {
		const g = this.snowG
		g.clear()

		// The blizzard is wind before it is density: the gust envelope sets both
		// the sideways speed and how far each flake is smeared into a streak.
		const gust = this.gustAt(this.time)
		this.updateWind(dt)
		const windSpeed = this.visual.gust * (26 + gust * 104)
		const wind = windSpeed * this.windDir
		const streak = Math.abs(wind) * 0.04

		// Cold air whitened by the snow it carries. Drawn under the flakes, and
		// only during a real gust, so a calm snowfall never fogs the frame.
		if (this.visual.gust > 0.05 && gust > 0.45) {
			g.rect(0, 0, VIEW.width, VIEW.height).fill({
				color: 0xdff0f8,
				alpha: 0.08 * this.visual.gust * (gust - 0.35)
			})
		}

		// A gust carries more snow with it, so density follows the same envelope
		// (with the baseline restored, so calm fronts keep their usual count).
		const gustDensity = 1 + this.visual.gust * (gust * 0.35 - 0.35)
		// Snowfall comes only from the front: a clear or overcast sky drops
		// nothing, which is what makes the clear sky read as clear.
		const intensity =
			(this.visual.snow * 0.2 + this.visual.gust * 0.85) * this.mood.snow * gustDensity
		const count = Math.min(this.flakes.length, Math.floor(this.flakes.length * intensity))
		const fallScale = 1 + this.visual.snow * 1.1 + this.visual.gust * gust * 0.9

		for (let i = 0; i < count; i += 1) {
			const flake = this.flakes[i]
			flake.y += flake.speed * fallScale * dt
			const push = wind * flake.wind
			flake.x += (flake.drift + Math.sin(this.time * 0.9 + flake.phase) * 5 + push) * dt
			if (flake.y > VIEW.height + 4) {
				flake.y = -4
				flake.x = randRange(-20, VIEW.width + 20)
			}
			if (flake.x > VIEW.width + 20) flake.x = -20
			if (flake.x < -20) flake.x = VIEW.width + 20

			// Fast snow reads as short horizontal smears rather than round dots, and
			// the flakes closest to the camera grow a pixel at the top of a gust.
			const smear = streak > 0.35 ? streak * (0.25 + flake.wind * 0.35) : 0
			const grow = gust > 0.9 && this.visual.gust > 0.6 ? 1 : 0
			const size = flake.size + grow
			// The smear trails behind the flake, so it points the way the wind blows:
			// to the left of a rightward gust and to the right of a leftward one.
			const tail = this.windDir >= 0 ? -smear : 0
			g.rect(flake.x + tail, flake.y, size + smear, size).fill({
				color: WINTER.snow,
				alpha: (flake.size > 1 ? 0.82 : 0.5) * (1 - Math.min(0.2, smear * 0.06))
			})
		}

		// Horizontal wind streaks for an exposed reach of river. They follow the
		// same bearing as the snow, so the whole frame blows one way.
		if (this.mood.wind > 0.01) {
			for (let i = 0; i < 18; i += 1) {
				const travel = (this.time * (170 + (i % 5) * 30) + i * 53) % 540
				const x = this.windDir >= 0 ? travel - 45 : VIEW.width + 45 - travel
				const y = 18 + ((i * 29) % (VIEW.height - 30))
				const length = 8 + (i % 4) * 5
				g.rect(x, y, length, 1).fill({
					color: WINTER.frost,
					alpha: 0.05 * this.mood.wind * (0.5 + (i % 3) * 0.25) * Math.abs(this.windDir)
				})
			}
		}

		// Snow landing on the water leaves tiny, short-lived rings. The spot is
		// drawn from the water body's own outline, so a drop never rings on the
		// pier, the bank or the snowfield behind it.
		if (Math.random() < dt * 14 * intensity) {
			const spot = this.pickWaterSpot()
			if (spot) {
				this.splashes.push({
					x: spot.x,
					y: spot.y,
					life: 0.34,
					maxLife: 0.34
				})
			}
		}

		this.splashes = this.splashes.filter((splash) => {
			splash.life -= dt
			if (splash.life <= 0) return false
			const t = 1 - splash.life / splash.maxLife
			g.ellipse(splash.x, splash.y, 1 + t * 3.2, 0.6 + t * 1.2).stroke({
				width: 1,
				color: WINTER.snow,
				alpha: (1 - t) * 0.3
			})
			return true
		})
	}

	/**
	 * A point on open water for a splash ring, or `null` when this frame's roll
	 * found only land. The frame is mostly water on the lake and the bay, so a
	 * few tries are enough; the river channel is narrower, hence the wider cap.
	 */
	protected pickWaterSpot(): { x: number; y: number } | null {
		const isWater = this.isWater
		if (!isWater) return null
		for (let attempt = 0; attempt < 12; attempt += 1) {
			const x = randRange(10, VIEW.width - 10)
			const y = randRange(26, 228)
			if (isWater(x, y)) return { x, y }
		}
		return null
	}

	/**
	 * Picks the bearing a front will keep. The strength stays in ±0.45..1 so the
	 * snow always has a real slant: a dead calm would drop it straight down and
	 * stop reading as a blizzard.
	 */
	protected pickWindBearing(): void {
		const strength = randRange(0.45, 1)
		this.windTarget = Math.random() < 0.5 ? -strength : strength
	}

	/**
	 * Eases the snow onto the bearing the front arrived with and holds it there
	 * for the rest of the front.
	 */
	protected updateWind(dt: number): void {
		this.windDir += (this.windTarget - this.windDir) * Math.min(1, dt * 1.1)
	}
}

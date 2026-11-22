import type { AreaMood } from '../areas'
import { type WeatherDef, type WorldPalette } from '../world'
import { AtmosphereSnow } from './AtmosphereSnow'

export class Atmosphere extends AtmosphereSnow {
	setMood(mood: AreaMood): void {
		this.mood = mood
	}

	/**
	 * Where the angler stands. Fog closes in around him: the clear pocket follows
	 * him, so what the player can see is the water he is actually fishing.
	 */
	setFocus(x: number, y: number): void {
		this.fog.setFocus(x, y)
	}

	/** Warm light position for the night glow (null hides it). */
	setLight(x: number | null, y: number | null): void {
		this.lightX = x
		this.lightY = y
	}

	/**
	 * Tells the atmosphere where the open water is, so the splash rings of
	 * falling snow stay on it. The scene owns the geometry; this layer only asks.
	 */
	setWaterTest(test: ((x: number, y: number) => boolean) | null): void {
		this.isWater = test
		this.buildWaterCoverage()
	}

	setWorld(palette: WorldPalette, weather: WeatherDef): void {
		this.world = palette
		if (weather.id === this.weather.id && this.weatherReady) return
		this.weather = weather
		// A new front brings its own bearing and keeps it until the next one.
		this.pickWindBearing()
		if (!this.weatherReady) {
			// The first frame of a session shows the current front immediately;
			// transitions only matter when the clock rolls into a new one.
			this.visual.snow = weather.snow
			this.visual.gust = weather.gust
			this.visual.fog = weather.fog
			this.visual.dark = weather.dark
			this.visual.cloud = weather.cloud
			this.visual.aurora = weather.aurora
			this.weatherReady = true
		}
	}

	/**
	 * Dev hook: switch the front on the spot instead of easing into it. A front
	 * that rolled in on its own takes seconds to blend; a dev pick has to be in
	 * front of the player immediately.
	 */
	snapTo(weather: WeatherDef): void {
		this.weather = weather
		this.pickWindBearing()
		this.weatherReady = true
		this.visual.snow = weather.snow
		this.visual.gust = weather.gust
		this.visual.fog = weather.fog
		this.visual.dark = weather.dark
		this.visual.cloud = weather.cloud
		this.visual.aurora = weather.aurora
	}

	update(dt: number): void {
		this.time += dt
		this.smoothWeather(dt)
		this.updateAurora()
		this.drawWash()
		this.drawGlow()
		this.updateFog(dt)
		this.drawSnow(dt)
	}
}

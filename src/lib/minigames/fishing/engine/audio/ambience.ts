import type { AudioMix } from '../audioMix'
import type { AreaId, WeatherId } from '../types'
import { WATER_BED_BY_AREA, WEATHER_BED, type BedDef, type SoundName } from './catalog'

interface AmbientVoice {
	id: string
	source: AudioBufferSourceNode
	gain: GainNode
	def: BedDef
}

export interface AmbienceDeps {
	getContext(): AudioContext | null
	getBus(): AudioNode | null
	getMix(): AudioMix
	/** True once a gesture has resumed the context; before that beds only queue. */
	canPlay(): boolean
	load(file: SoundName): Promise<AudioBuffer | null>
}

/**
 * The two crossfaded ambience layers: the water body's bed and the weather
 * front's bed. Each layer keeps its own token so a fast sequence of fronts can
 * never resurrect an older load.
 */
export class AmbienceBeds {
	private waterBed: AmbientVoice | null = null
	private waterWanted: AreaId | null = null
	private waterToken = 0
	private weatherBed: AmbientVoice | null = null
	private weatherWanted: WeatherId | null = null
	private weatherToken = 0

	constructor(private readonly deps: AmbienceDeps) {}

	/** Selects the looping water bed for a water body (crossfaded). */
	setWater(areaId: AreaId): void {
		this.waterWanted = areaId
		if (!this.deps.canPlay()) return
		void this.applyWater(areaId)
	}

	/**
	 * Selects the weather bed, or `null` to fade it out (menus have a water bed
	 * but no front over them). Crossfaded like the water bed.
	 */
	setWeather(weather: WeatherId | null): void {
		this.weatherWanted = weather
		if (!this.deps.canPlay()) return
		void this.applyWeather(weather)
	}

	/** Applies the wanted beds once the AudioContext has been unlocked. */
	applyWanted(): void {
		if (this.waterWanted) void this.applyWater(this.waterWanted)
		if (this.weatherWanted) void this.applyWeather(this.weatherWanted)
	}

	/** Restarts the live layers for the dev panel's ambience audition. */
	restartWanted(): void {
		if (this.waterWanted) void this.applyWater(this.waterWanted)
		if (this.weatherWanted) void this.applyWeather(this.weatherWanted)
	}

	applyGains(): void {
		const ctx = this.deps.getContext()
		if (!ctx) return
		const mix = this.deps.getMix()
		const now = ctx.currentTime
		for (const bed of [this.waterBed, this.weatherBed]) {
			if (!bed) continue
			bed.gain.gain.setTargetAtTime(mix.ambience * bed.def.level, now, 0.08)
		}
	}

	destroy(): void {
		this.waterBed?.source.stop()
		this.waterBed = null
		this.weatherBed?.source.stop()
		this.weatherBed = null
	}

	private async applyWater(areaId: AreaId): Promise<void> {
		if (this.waterBed?.id === areaId) return
		await this.replaceBed('water', areaId, WATER_BED_BY_AREA[areaId])
	}

	private async applyWeather(weather: WeatherId | null): Promise<void> {
		if (this.weatherBed?.id === weather) return
		await this.replaceBed('weather', weather, weather ? WEATHER_BED[weather] : null)
	}

	/**
	 * Crossfades one bed layer to `def`. Only one of the two layers can be
	 * fading at a time in practice, but each keeps its own token so a fast
	 * sequence of fronts can never resurrect an older load.
	 */
	private async replaceBed(
		layer: 'water' | 'weather',
		id: string | null,
		def: BedDef | null
	): Promise<void> {
		const ctx = this.deps.getContext()
		const out = this.deps.getBus()
		if (!ctx || !out) return

		const token = layer === 'water' ? ++this.waterToken : ++this.weatherToken
		const old = layer === 'water' ? this.waterBed : this.weatherBed
		if (layer === 'water') this.waterBed = null
		else this.weatherBed = null

		if (old) {
			const now = ctx.currentTime
			old.gain.gain.cancelScheduledValues(now)
			old.gain.gain.setTargetAtTime(0, now, 0.35)
			window.setTimeout(() => {
				try {
					old.source.stop()
				} catch {
					// Already stopped.
				}
			}, 1400)
		}

		if (!def) return

		const buffer = await this.deps.load(def.file)
		const active = layer === 'water' ? this.waterToken : this.weatherToken
		if (token !== active || !buffer || !this.deps.getContext()) return

		const source = this.deps.getContext()!.createBufferSource()
		source.buffer = buffer
		source.loop = true
		source.playbackRate.value = def.rate

		let head: AudioNode = source
		if (def.cutoff) {
			const filter = this.deps.getContext()!.createBiquadFilter()
			filter.type = 'lowpass'
			filter.frequency.value = def.cutoff
			filter.Q.value = 0.7
			source.connect(filter)
			head = filter
		}

		const gain = this.deps.getContext()!.createGain()
		gain.gain.value = 0
		if (head !== source) source.connect(head)
		head.connect(gain)
		gain.connect(out)
		gain.gain.setTargetAtTime(
			this.deps.getMix().ambience * def.level,
			this.deps.getContext()!.currentTime,
			0.6
		)
		source.start()

		const voice: AmbientVoice = { id: id ?? '', source, gain, def }
		if (layer === 'water') this.waterBed = voice
		else this.weatherBed = voice
	}
}

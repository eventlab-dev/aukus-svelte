import type { AudioMix, MixChannel } from '../audioMix'
import type { AreaId, WeatherId } from '../types'
import { AmbienceBeds } from './ambience'
import { CueBank } from './cues'
import { REEL_RATE, REEL_STRAIN_FLOOR, REEL_STRAIN_PITCH } from './catalog'
import { ChargeVoice, ReelVoice, createNoiseBuffer } from './loops'

/**
 * Public audio facade. The one-shot cues live in {@link CueBank}, the context
 * and buffer cache in {@link AudioCore}, and the looping layers here: the reel,
 * the charge wind-up and the two ambience beds.
 */
export class AudioKit extends CueBank {
	/** The looping reel texture, present while the player holds the line. */
	private reelLoop: ReelVoice | null = null
	/** The looping charge wind-up, present while the cast is being wound up. */
	private chargeLoop: ChargeVoice | null = null
	/** Lazily built looping noise for the charge; one buffer for the session. */
	private noise: AudioBuffer | null = null
	private readonly beds: AmbienceBeds

	/**
	 * Timers that release the loops `preview()` starts.
	 *
	 * They used to share one field, so auditioning any other channel cleared the
	 * release of the wind-up or the reel and that loop played on forever: the
	 * panel is used to compare cues, so pressing the next one is the normal case,
	 * not an edge case. One timer per looping cue keeps every release alive.
	 */
	private chargePreviewTimer = 0
	private reelPreviewTimer = 0
	/**
	 * The angler's grip, 0..1, as the fight last reported it.
	 *
	 * The loop reads it on start and on every change, so a reel that begins while
	 * the hand is already failing starts at the strained pitch instead of sliding
	 * up to it after the crank is already turning.
	 */
	private grip = 1

	constructor(muted: boolean, assetBase: string, mix?: Partial<AudioMix>) {
		super(muted, assetBase, mix)
		this.beds = new AmbienceBeds({
			getContext: () => this.ctx,
			getBus: () => this.bus(false),
			getMix: () => this.mix,
			// The boot screen creates the context for preloading; beds must not
			// start looping until the resume gesture has actually happened.
			canPlay: () => this.unlocked,
			load: (file) => this.load(file)
		})
	}

	protected override onUnlocked(): void {
		this.beds.applyWanted()
	}

	protected override afterMixChange(): void {
		this.beds.applyGains()
		if (this.reelLoop && this.ctx) {
			this.reelLoop.setLevel(this.mix.reel, this.ctx)
		}
	}

	/** Reel handle: loops while the player is pulling the line. */
	startReel(): void {
		if (this.reelLoop || !this.ctx) return
		const buffer = this.getBuffer('reel')
		if (!buffer) {
			void this.load('reel').then((loaded) => {
				if (loaded) this.startReel()
			})
			return
		}
		const ctx = this.ctx
		const out = this.bus(false)
		if (!ctx || !out) return
		this.reelLoop = new ReelVoice(ctx, out, buffer, this.mix.reel, this.reelRate())
	}

	/**
	 * The angler's remaining grip, 0..1, from the fight model. The last third is
	 * where the crank starts to climb: by the time the grip is gone the reel is
	 * turning a quarter faster, which is the audible half of the stamina bar.
	 */
	setGrip(grip: number): void {
		const next = Math.max(0, Math.min(1, grip))
		if (Math.abs(next - this.grip) < 0.002) return
		this.grip = next
		if (this.reelLoop && this.ctx) {
			this.reelLoop.setRate(this.reelRate(), this.ctx)
		}
	}

	/** Playback rate of the reel for the current grip; see {@link setGrip}. */
	private reelRate(): number {
		const strain = Math.max(0, Math.min(1, (REEL_STRAIN_FLOOR - this.grip) / REEL_STRAIN_FLOOR))
		return REEL_RATE * (1 + REEL_STRAIN_PITCH * strain)
	}

	/** Releases the reel handle: the loop fades out instead of cutting off. */
	stopReel(): void {
		const loop = this.reelLoop
		const ctx = this.ctx
		if (!loop || !ctx) return
		this.reelLoop = null
		loop.stop(ctx)
	}

	/**
	 * Charge wind-up: filtered noise, held for as long as the player pumps the
	 * meter. `setCharge` opens the filter and raises the level as it fills.
	 */
	startCharge(): void {
		if (this.chargeLoop || !this.ctx) return
		const ctx = this.ctx
		const out = this.bus(false)
		if (!ctx || !out) return
		this.chargeLoop = new ChargeVoice(ctx, out, this.noiseBuffer(ctx), this.mix.charge)
	}

	/** @param charge 0..1 fill of the power meter. */
	setCharge(charge: number): void {
		const loop = this.chargeLoop
		const ctx = this.ctx
		if (!loop || !ctx) return
		loop.setCharge(charge, this.mix.charge, ctx)
	}

	override stopCharge(release?: number): void {
		const loop = this.chargeLoop
		const ctx = this.ctx
		if (!loop || !ctx) return
		this.chargeLoop = null
		loop.stop(ctx, release)
	}

	/** The session's looping noise bed, built on first use. */
	private noiseBuffer(ctx: AudioContext): AudioBuffer {
		if (this.noise) return this.noise
		this.noise = createNoiseBuffer(ctx)
		return this.noise
	}

	/** Selects the looping water bed for a water body (crossfaded). */
	setAmbience(areaId: AreaId): void {
		this.beds.setWater(areaId)
	}

	/**
	 * Selects the weather bed, or `null` to fade it out (menus have a water bed
	 * but no front over them). Crossfaded like the water bed.
	 */
	setWeather(weather: WeatherId | null): void {
		this.beds.setWeather(weather)
	}

	/**
	 * Plays one channel's cue, for the dev panel: every fader can be heard on
	 * its own without waiting for the game to trigger it.
	 *
	 * The two looping cues are auditioned for a fixed stretch and then released.
	 * Their release timers are per cue, so auditioning the next channel never
	 * strands a loop: the earlier one still stops on its own schedule.
	 */
	preview(channel: MixChannel): void {
		switch (channel) {
			case 'hover':
				this.hover()
				break
			case 'click':
				this.click()
				break
			case 'back':
				this.back()
				break
			case 'cast':
				this.cast()
				break
			case 'charge':
				// Re-auditioning restarts the loop from its own release, not from a
				// release that was already scheduled.
				window.clearTimeout(this.chargePreviewTimer)
				this.stopCharge()
				this.startCharge()
				this.setCharge(0.8)
				this.chargePreviewTimer = window.setTimeout(() => {
					this.chargePreviewTimer = 0
					this.stopCharge()
				}, 520)
				break
			case 'splash':
				this.splash()
				break
			case 'plop':
				this.plop()
				break
			case 'bite':
				this.bite()
				break
			case 'nibble':
				this.nibble()
				break
			case 'hook':
				this.hook()
				break
			case 'reel':
				window.clearTimeout(this.reelPreviewTimer)
				this.stopReel()
				this.startReel()
				this.reelPreviewTimer = window.setTimeout(() => {
					this.reelPreviewTimer = 0
					this.stopReel()
				}, 800)
				break
			case 'catchCommon':
				this.catchFish()
				break
			case 'escape':
				this.escape()
				break
			case 'warn':
				this.warn()
				break
			case 'counter':
				this.counter()
				break
			case 'ready':
				this.ready()
				break
			case 'landReady':
				this.landReady()
				break
			case 'resist':
				this.resist()
				break
			case 'gripOut':
				this.gripOut()
				break
			case 'objective':
				this.objective()
				break
			case 'comboBreak':
				this.comboBreak()
				break
			case 'newRecord':
				this.newRecord()
				break
			case 'ambience':
				// The beds are already looping in game; restarting them is the only
				// way to audition the layer from a menu, where no ambience is running.
				this.beds.restartWanted()
				break
			case 'master':
				this.click()
				break
		}
	}

	override destroy(): void {
		window.clearTimeout(this.chargePreviewTimer)
		window.clearTimeout(this.reelPreviewTimer)
		this.stopReel()
		this.stopCharge()
		this.beds.destroy()
		super.destroy()
	}
}

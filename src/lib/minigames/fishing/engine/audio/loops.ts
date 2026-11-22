import {
	CHARGE_FADE,
	CHARGE_FILTER_MAX,
	CHARGE_FILTER_MIN,
	CHARGE_FILTER_Q,
	CHARGE_HIGHPASS,
	CHARGE_HIGHPASS_Q,
	CHARGE_MIN_RATIO,
	CHARGE_NOISE_SECONDS,
	REEL_FADE,
	REEL_LOOP_END,
	REEL_LOOP_START,
	REEL_RATE
} from './catalog'

/** The looping reel handle, present while the player holds the line. */
export class ReelVoice {
	private readonly source: AudioBufferSourceNode
	private readonly gain: GainNode
	private rate: number

	constructor(
		ctx: AudioContext,
		out: AudioNode,
		buffer: AudioBuffer,
		level: number,
		rate = REEL_RATE
	) {
		const source = ctx.createBufferSource()
		source.buffer = buffer
		source.loop = true
		source.loopStart = REEL_LOOP_START
		source.loopEnd = REEL_LOOP_END
		source.playbackRate.value = rate
		const gain = ctx.createGain()
		const now = ctx.currentTime
		gain.gain.setValueAtTime(0, now)
		gain.gain.linearRampToValueAtTime(level, now + REEL_FADE)
		source.connect(gain)
		gain.connect(out)
		source.start(now, REEL_LOOP_START)
		this.source = source
		this.gain = gain
		this.rate = rate
	}

	setLevel(level: number, ctx: AudioContext): void {
		this.gain.gain.setTargetAtTime(level, ctx.currentTime, 0.03)
	}

	/**
	 * Playing speed of the loop. It carries both the pitch and the cadence, so a
	 * climbing rate reads as a crank that is being turned harder: the ratchet
	 * quickens and its note rises with it.
	 */
	setRate(rate: number, ctx: AudioContext): void {
		if (Math.abs(rate - this.rate) < 0.004) return
		this.rate = rate
		this.source.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.12)
	}

	/** Release the handle: the loop fades out instead of cutting off. */
	stop(ctx: AudioContext): void {
		const now = ctx.currentTime
		this.gain.gain.cancelScheduledValues(now)
		this.gain.gain.setTargetAtTime(0, now, REEL_FADE / 3)
		try {
			this.source.stop(now + REEL_FADE + 0.02)
		} catch {
			// Already stopped.
		}
	}
}

/** The synthesized wind-up, present while the cast meter is pumped. */
export class ChargeVoice {
	private readonly source: AudioBufferSourceNode
	private readonly gain: GainNode
	private readonly filter: BiquadFilterNode

	constructor(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, peak: number) {
		const source = ctx.createBufferSource()
		source.buffer = noise
		source.loop = true
		const filter = ctx.createBiquadFilter()
		filter.type = 'bandpass'
		filter.Q.value = CHARGE_FILTER_Q
		filter.frequency.value = CHARGE_FILTER_MIN
		// The low cut sits after the band, so `setCharge` can keep sweeping the
		// band without ever opening the rumble back up.
		const highpass = ctx.createBiquadFilter()
		highpass.type = 'highpass'
		highpass.frequency.value = CHARGE_HIGHPASS
		highpass.Q.value = CHARGE_HIGHPASS_Q
		const gain = ctx.createGain()
		const now = ctx.currentTime
		gain.gain.setValueAtTime(0, now)
		gain.gain.linearRampToValueAtTime(peak * CHARGE_MIN_RATIO, now + CHARGE_FADE)
		source.connect(filter)
		filter.connect(highpass)
		highpass.connect(gain)
		gain.connect(out)
		source.start(now)
		this.source = source
		this.gain = gain
		this.filter = filter
	}

	/** @param charge 0..1 fill of the power meter. */
	setCharge(charge: number, peak: number, ctx: AudioContext): void {
		const t = Math.max(0, Math.min(1, charge))
		const now = ctx.currentTime
		const cutoff = CHARGE_FILTER_MIN + (CHARGE_FILTER_MAX - CHARGE_FILTER_MIN) * t
		const volume = peak * (CHARGE_MIN_RATIO + (1 - CHARGE_MIN_RATIO) * t)
		this.filter.frequency.setTargetAtTime(cutoff, now, 0.05)
		this.gain.gain.setTargetAtTime(volume, now, 0.08)
	}

	/**
	 * Stops the wind-up.
	 *
	 * @param release Seconds the wind-up takes to leave. The default is the short
	 * attack fade used when the cast is abandoned; a throw passes `CAST_BLEND`
	 * so the whoosh takes over from a sound that is still there, instead of
	 * replacing one that has already gone.
	 */
	stop(ctx: AudioContext, release = CHARGE_FADE): void {
		const now = ctx.currentTime
		const fade = Math.max(0.012, release)
		const gain = this.gain.gain
		const filter = this.filter.frequency
		// A straight ramp to zero: an exponential approach leaves a tail that the
		// throw then has to cover, and the two tails read as a buzz.
		gain.cancelScheduledValues(now)
		gain.setValueAtTime(gain.value, now)
		gain.linearRampToValueAtTime(0, now + fade)
		// The band closes as the wind-up leaves, so the pitch falls away with it.
		filter.cancelScheduledValues(now)
		filter.setValueAtTime(filter.value, now)
		filter.linearRampToValueAtTime(CHARGE_FILTER_MIN * 0.6, now + fade)
		try {
			this.source.stop(now + fade + 0.02)
		} catch {
			// Already stopped.
		}
	}
}

/** The session's looping noise bed, built on first use. */
export function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
	const length = Math.floor(ctx.sampleRate * CHARGE_NOISE_SECONDS)
	const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
	const data = buffer.getChannelData(0)
	for (let i = 0; i < length; i += 1) data[i] = Math.random() * 1.4 - 0.7
	return buffer
}

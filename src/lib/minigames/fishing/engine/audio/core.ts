import { AUDIO_MIX, type AudioMix, type MixChannel, mixWith } from '../audioMix'
import { ROUND_CUES, SOUND_FILES, UI_CUES, type SoundName } from './catalog'
import { trimLeadIn } from './leadIn'

/**
 * Web Audio plumbing shared by the cue bank and the ambience beds: context,
 * master/world buses, buffer cache and the mute/pause state.
 */
export class AudioCore {
	protected ctx: AudioContext | null = null
	protected master: GainNode | null = null
	/**
	 * Everything the round itself makes — the ambience beds, the fight cues, the
	 * float — hangs off this bus instead of the master. The pause menu pulls it
	 * to zero, so a paused round goes quiet (including a bed that is still
	 * crossfading) while the menu's own clicks stay audible.
	 */
	protected world: GainNode | null = null
	protected paused = false
	protected muted: boolean
	/**
	 * True once the first gesture has resumed the context. The context itself is
	 * created earlier, on the boot screen, so the sample pack can be decoded
	 * before the player can press anything (see {@link preloadAllSounds}).
	 */
	protected unlocked = false
	protected readonly base: string
	protected mix: AudioMix
	protected readonly buffers = new Map<SoundName, AudioBuffer>()
	protected readonly loading = new Map<SoundName, Promise<AudioBuffer | null>>()

	constructor(muted: boolean, assetBase: string, mix?: Partial<AudioMix>) {
		this.muted = muted
		this.base = `${assetBase}/sounds`
		this.mix = mixWith(mix ?? null)
	}

	get isMuted(): boolean {
		return this.muted
	}

	/** Snapshot of the current balance, used by the dev panel. */
	get mixValues(): AudioMix {
		return { ...this.mix }
	}

	get defaultMix(): AudioMix {
		return { ...AUDIO_MIX }
	}

	/**
	 * Replaces the whole balance. Live loops and the master bus follow
	 * immediately, so a slider is audible while it is being dragged.
	 */
	setMix(mix: Partial<AudioMix>): void {
		this.mix = mixWith({ ...this.mix, ...mix })
		this.applyMaster()
		this.afterMixChange()
	}

	setChannel(channel: MixChannel, value: number): void {
		this.setMix({ [channel]: value })
	}

	setMuted(muted: boolean): void {
		this.muted = muted
		this.applyMaster()
	}

	unlock(): void {
		const ctx = this.ensureContext()
		if (!ctx) return
		if (ctx.state === 'suspended') void ctx.resume()
		if (this.unlocked) return
		this.unlocked = true
		void this.preloadUi()
		this.onUnlocked()
	}

	/**
	 * Silences the round for as long as the pause overlay is up, menus included.
	 * Interface cues bypass this bus, so the pause menu still answers a click.
	 */
	setPaused(paused: boolean): void {
		this.paused = paused
		if (!this.world || !this.ctx) return
		this.world.gain.setTargetAtTime(paused ? 0 : 1, this.ctx.currentTime, 0.04)
	}

	/**
	 * Warms the gameplay cues when a round begins. They arrive within the first
	 * second of the cast, and anything still in flight is awaited by `play`, so
	 * a slow download delays one cue instead of the whole pack.
	 */
	preloadRound(): void {
		for (const name of ROUND_CUES) void this.load(name)
	}

	/**
	 * Fetches and decodes the whole sample pack, so a round never waits for a
	 * file mid-cast.
	 *
	 * Browsers refuse to start audio before a gesture, but they do allow an
	 * `AudioContext` to be created (suspended) and `decodeAudioData` to run, so
	 * the buffers are ready the moment `unlock` resumes the context. `load`
	 * already deduplicates in-flight requests and caches results, which makes
	 * this safe to call alongside the UI/round warm-ups.
	 */
	async preloadAllSounds(onProgress?: (loaded: number, total: number) => void): Promise<void> {
		if (!this.ensureContext()) {
			onProgress?.(0, 0)
			return
		}
		const names = Object.keys(SOUND_FILES) as SoundName[]
		let done = 0
		onProgress?.(0, names.length)
		await Promise.all(
			names.map(async (name) => {
				await this.load(name)
				done += 1
				onProgress?.(done, names.length)
			})
		)
	}

	destroy(): void {
		if (!this.ctx) return
		void this.ctx.close().catch(() => undefined)
		this.ctx = null
		this.master = null
		this.world = null
	}

	// ------------------------------------------------------------- internals

	/**
	 * Creates the shared context without resuming it. Playback stays silent
	 * until a gesture calls `unlock`; decoding and graph setup do not need one.
	 */
	protected ensureContext(): AudioContext | null {
		if (this.ctx) return this.ctx
		const ctor: typeof AudioContext | undefined =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
		if (!ctor) return null
		try {
			const ctx = new ctor()
			const master = ctx.createGain()
			master.gain.value = this.muted ? 0 : this.mix.master
			master.connect(ctx.destination)
			const world = ctx.createGain()
			world.gain.value = this.paused ? 0 : 1
			world.connect(master)
			this.ctx = ctx
			this.master = master
			this.world = world
			return ctx
		} catch {
			this.ctx = null
			return null
		}
	}

	protected applyMaster(): void {
		if (!this.master || !this.ctx) return
		this.master.gain.setTargetAtTime(this.muted ? 0 : this.mix.master, this.ctx.currentTime, 0.02)
	}

	/** The node gameplay audio connects to; the master bus for interface cues. */
	protected bus(ui: boolean): AudioNode | null {
		return ui ? this.master : (this.world ?? this.master)
	}

	protected getBuffer(name: SoundName): AudioBuffer | undefined {
		return this.buffers.get(name)
	}

	protected async load(name: SoundName): Promise<AudioBuffer | null> {
		const cached = this.buffers.get(name)
		if (cached) return cached
		const pending = this.loading.get(name)
		if (pending) return pending

		const ctx = this.ctx
		if (!ctx) return null

		const promise = (async () => {
			try {
				const response = await fetch(`${this.base}/${SOUND_FILES[name]}`)
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`)
				}
				const data = await response.arrayBuffer()
				const buffer = await ctx.decodeAudioData(data)
				// Loop beds keep their exact length: trimming their head would move
				// the loop point and put a seam in the ambience.
				const trimmed = name.startsWith('amb') ? buffer : trimLeadIn(ctx, buffer)
				this.buffers.set(name, trimmed)
				return trimmed
			} catch (error) {
				console.warn(`[fishing] sound failed: ${SOUND_FILES[name]}`, error)
				return null
			} finally {
				this.loading.delete(name)
			}
		})()
		this.loading.set(name, promise)
		return promise
	}

	protected play(name: SoundName, volume: number, rate = 1, delay = 0, ui = false): void {
		if (this.muted || !this.ctx) return
		const buffer = this.buffers.get(name)
		if (buffer) {
			this.start(buffer, volume, rate, delay, ui)
			return
		}
		void this.load(name).then((loaded) => {
			if (!loaded || this.muted) return
			this.start(loaded, volume, rate, delay, ui)
		})
	}

	/** Hook for title/ambience layers once the context exists. */
	protected onUnlocked(): void {}

	/** Hook for live gain changes that the base mix does not own. */
	protected afterMixChange(): void {}

	private start(buffer: AudioBuffer, volume: number, rate: number, delay = 0, ui = false): void {
		const ctx = this.ctx
		const master = this.master
		const out = this.bus(ui)
		if (!ctx || !master || !out) return
		const at = ctx.currentTime + Math.max(0, delay)
		const source = ctx.createBufferSource()
		source.buffer = buffer
		source.playbackRate.value = rate
		const gain = ctx.createGain()
		gain.gain.value = volume
		source.connect(gain)
		gain.connect(out)
		source.onended = () => {
			source.disconnect()
			gain.disconnect()
		}
		// Web Audio schedules the start, so a two-note cue needs no timers.
		source.start(at)
	}

	private preloadUi(): void {
		for (const name of UI_CUES) void this.load(name)
	}
}

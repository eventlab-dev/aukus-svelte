import { SvelteMap } from 'svelte/reactivity'

type SoundConfig = {
	volume?: number
	loop?: boolean
	playbackRate?: number
	fadeIn?: number
}

class SoundManager {
	private _sounds: Map<string, AudioBuffer> = new SvelteMap()
	private _audioContext: AudioContext
	private _gainNode: GainNode
	private _currentSource: AudioBufferSourceNode | null = null
	private _settings = {
		value: {
			isMuted: false,
			volume: 0.3,
			volumeBeforeMute: 0.3,
			lastPlayedSoundKey: ''
		}
	}

	readonly volumeBeforeMute = $derived(this._settings.value.volumeBeforeMute)
	readonly isMuted = $derived(this._settings.value.isMuted)
	readonly volume = $derived(this._settings.value.volume)

	constructor() {
		this._audioContext = new AudioContext()
		this._gainNode = this._audioContext.createGain()
		this._gainNode.connect(this._audioContext.destination)
	}

	async preloadSounds(soundArray: { key: string; url: string }[]): Promise<void> {
		console.log('preloading sounds')
		const loadPromises = soundArray.map(({ key, url }) =>
			this.loadSound(key, url).catch((error) => {
				console.error(`Failed to load sound ${key}:`, error)
			})
		)

		await Promise.all(loadPromises)
	}

	public async loadSound(key: string, url: string): Promise<void> {
		if (this._sounds.has(key)) {
			return
		}

		try {
			const response = await fetch(url)
			const arrayBuffer = await response.arrayBuffer()
			const audioBuffer = await this._audioContext.decodeAudioData(arrayBuffer)
			this._sounds.set(key, audioBuffer)
		} catch (error) {
			throw new Error(`Failed to load sound ${key}: ${error}`)
		}
	}

	public playRandom(config: SoundConfig = {}): void {
		const lastPlayed = this._settings.value.lastPlayedSoundKey
		const randomKey = this._getRandomSoundKey(this._sounds, lastPlayed)

		this.play(randomKey, config)

		this._settings.value = {
			...this._settings.value,
			lastPlayedSoundKey: randomKey
		}
	}

	public play(key: string, config: SoundConfig = {}) {
		// Stop current sound if any
		this.stop()

		const audioBuffer = this._sounds.get(key)
		if (!audioBuffer) {
			console.warn(`Sound not found: ${key}`)
			return
		}

		// Create new source node
		this._currentSource = this._audioContext.createBufferSource()
		this._currentSource.buffer = audioBuffer
		this._currentSource.loop = config.loop || false
		this._currentSource.playbackRate.value = config.playbackRate || 1.0

		// Connect to gain node for volume control
		this._currentSource.connect(this._gainNode)

		// Apply fade in if specified
		const now = this._audioContext.currentTime
		const volume = this._calculateVolume(config.volume)

		if (config.fadeIn && config.fadeIn > 0) {
			this._gainNode.gain.setValueAtTime(0, now)
			this._gainNode.gain.linearRampToValueAtTime(volume, now + config.fadeIn)
		} else {
			this._gainNode.gain.setValueAtTime(volume, now)
		}

		// Start playback
		this._currentSource.start()

		// Handle playback end
		if (!config.loop) {
			const currentSourceRef = this._currentSource
			currentSourceRef.addEventListener('ended', () => {
				if (this._currentSource === currentSourceRef) {
					this._currentSource = null
				}
			})
		}
	}

	public stop() {
		if (!this._currentSource) return

		this._currentSource.stop()
		this._currentSource.disconnect()
		this._currentSource = null
	}

	public setGlobalVolume(volume: number) {
		this._settings.value = {
			...this._settings.value,
			volume,
			volumeBeforeMute: volume,
			isMuted: volume === 0
		}
		this._updateVolume()
	}

	public mute() {
		this._settings.value = {
			...this._settings.value,
			isMuted: true,
			volumeBeforeMute: this.volume,
			volume: 0
		}
		this._updateVolume()
	}

	public unmute() {
		this._settings.value = {
			...this._settings.value,
			isMuted: false,
			volume: this.volumeBeforeMute
		}
		this._updateVolume()
	}

	public toggleMute() {
		this._settings.value = {
			...this._settings.value,
			isMuted: !this.isMuted,
			volume: this.isMuted ? this.volumeBeforeMute : 0
		}
		this._updateVolume()
	}

	public removeSound(key: string) {
		this._sounds.delete(key)
	}

	public destroy() {
		this.stop()
		this._sounds.clear()

		if (this._audioContext.state !== 'closed') {
			this._audioContext.close()
		}
	}

	private _calculateVolume(soundVolume?: number) {
		const baseVolume = soundVolume !== undefined ? soundVolume : 1.0
		return this.isMuted ? 0 : baseVolume * this.volume
	}

	private _updateVolume() {
		const now = this._audioContext.currentTime
		const volume = this._calculateVolume()

		this._gainNode.gain.cancelScheduledValues(now)
		this._gainNode.gain.setValueAtTime(volume, now)
	}

	private _getRandomSoundKey<K, V>(map: Map<K, V>, lastPlayedSoundKey?: K): K {
		const keys = Array.from(map.keys())
		const randomIndex = Math.floor(Math.random() * keys.length)
		const randomKey = keys[randomIndex]

		if (randomKey === lastPlayedSoundKey) {
			const otherKey = keys.find((key) => key !== randomKey)
			if (otherKey) {
				return otherKey
			}
		}

		return randomKey
	}
}

export default SoundManager

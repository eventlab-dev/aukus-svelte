import { Texture } from 'pixi.js'
import type { AreaId, WeatherId } from './types'
import { AUDIO_MIX, MIX_CHANNELS, type AudioMix } from './audioMix'
import { AudioMixPanel } from './ui/AudioMixPanel'
import { DevSkyPanel } from './ui/DevSkyPanel'
import { ZonePanel } from './ui/ZonePanel'
import { applyZoneProfile } from './game/fight/zoneTuning'
import { GameScreen } from './screens/GameScreen'
import { GameInputLayer } from './GameInputLayer'

export abstract class GameDevLayer extends GameInputLayer {
	toggleAudioPanel(): void {
		if (!import.meta.env.DEV) return
		if (this.audioPanel?.isOpen) this.closeAudioPanel()
		else this.openAudioPanel()
	}

	openAudioPanel(): void {
		if (!import.meta.env.DEV || this.assetBag === null) return
		const panel = this.audioPanel ?? this.mountAudioPanel()
		if (!panel.isOpen) {
			panel.open()
			// Lift any pause duck: the mixer has to hear the channels it edits.
			this.screens.active?.onAudioPanel(true)
		}
	}

	closeAudioPanel(): void {
		if (!this.audioPanel?.isOpen) return
		this.audioPanel.close()
		this.screens.active?.onAudioPanel(false)
	}

	/**
	 * Opens or closes the dev sky-and-water inspector (`F3`, dev only).
	 *
	 * The weather is rolled by the clock, the hour follows the player and the
	 * water is a table of numbers; this window is where all three can be looked at
	 * while the scene runs.
	 */
	toggleDevPanel(): void {
		if (!import.meta.env.DEV) return
		if (this.skyPanel?.isOpen) this.closeDevPanel()
		else this.openDevPanel()
	}

	openDevPanel(): void {
		if (!import.meta.env.DEV || this.assetBag === null) return
		const panel = this.skyPanel ?? this.mountSkyPanel()
		if (!panel.isOpen) panel.open()
	}

	closeDevPanel(): void {
		this.skyPanel?.close()
	}

	/**
	 * Opens or closes the dash-zone tuner (`F8`, dev only).
	 *
	 * The zone is a feel — how long it takes to appear, how much of it the truth
	 * gets during a feint, how the receipt of a counter drains to grey — and none
	 * of that can be judged from the constants. The panel plays the three beats
	 * the fight has and puts a slider under every value; the sliders write into
	 * `zoneTuning`, which the live fight reads, so the next dash is already tuned.
	 */
	toggleZonePanel(): void {
		if (!import.meta.env.DEV) return
		if (this.zonePanel?.isOpen) this.closeZonePanel()
		else this.openZonePanel()
	}

	openZonePanel(): void {
		if (!import.meta.env.DEV || this.assetBag === null) return
		const panel = this.zonePanel ?? this.mountZonePanel()
		if (!panel.isOpen) {
			// The tuner only ever edits the desktop table: its sliders read and write
			// the numbers the shipped defaults are built from, so opening it on a
			// phone must not turn the finger's geometry into a code change.
			applyZoneProfile('mouse')
			panel.open()
		}
	}

	closeZonePanel(): void {
		if (!this.zonePanel?.isOpen) return
		this.zonePanel.close()
		// The session goes back to its own table (the touch one on a phone).
		applyZoneProfile(this.touch ? 'touch' : 'mouse')
	}

	/**
	 * Pins the hour for the dev session, or returns the sky to the wall clock
	 * with null. Nothing is saved: the real time is the game's, not the panel's.
	 */
	setTimeOfDay(minutes: number | null): void {
		this.clock.setTime(minutes)
		this.skyPanel?.refresh()
	}

	/**
	 * Pins the weather of the current water body. Saved like a normal front, so
	 * the pick survives a reload.
	 */
	setWeather(weather: WeatherId, areaId: AreaId = this.areaId): void {
		this.clock.setWeather(weather, areaId)
		this.clock.persist()
		const active = this.screens.active
		if (active instanceof GameScreen && areaId === this.areaId) {
			active.snapWeather()
		}
		this.skyPanel?.refresh()
	}

	protected mountSkyPanel(): DevSkyPanel {
		const panel = new DevSkyPanel({
			weather: () => this.clock.weatherFor(this.areaId),
			onWeather: (weather) => this.setWeather(weather),
			pinned: () => this.clock.pinnedMinutes,
			onTime: (minutes) => this.setTimeOfDay(minutes),
			onClose: () => this.closeDevPanel()
		})
		this.skyPanel = panel
		// Above the screen layer, so the inspector is never clipped by the
		// letterbox and its buttons take the click before the water does.
		this.world.addChild(panel)
		return panel
	}

	protected mountZonePanel(): ZonePanel {
		const panel = new ZonePanel({
			onClose: () => this.closeZonePanel(),
			// The preview fights a real barracuda, so it needs that fish's sprite.
			fish: this.assetBag?.fish.barracuda ?? Texture.WHITE
		})
		this.zonePanel = panel
		// Above the screen layer, so the tuner is not clipped by the letterbox and
		// its sliders take the drag before the water does.
		this.world.addChild(panel)
		return panel
	}

	protected mountAudioPanel(): AudioMixPanel {
		const panel = new AudioMixPanel({
			audio: this.audio,
			onPersist: (mix) => this.persistMix(mix),
			isMuted: () => this.muted,
			onToggleMute: () => this.toggleMute(),
			onClose: () => this.closeAudioPanel()
		})
		this.audioPanel = panel
		// Above the screen layer, so the panel is not clipped by the letterbox and
		// receives pointer events before the game does.
		this.world.addChild(panel)
		return panel
	}

	/**
	 * Stores only the channels that differ from the code defaults, so a later
	 * edit to `audioMix.ts` still wins for everything the panel did not touch.
	 */
	protected persistMix(mix: AudioMix): void {
		const overrides: Partial<AudioMix> = {}
		for (const channel of MIX_CHANNELS) {
			const value = mix[channel.id]
			if (Math.abs(value - AUDIO_MIX[channel.id]) > 0.004) {
				overrides[channel.id] = value
			}
		}
		this.settings.mix = Object.keys(overrides).length > 0 ? overrides : null
	}
}

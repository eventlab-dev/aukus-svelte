import { SOUNDS } from '$lib/constants'
import PlayersMovesStore from './PlayersMovesStore.svelte'
import PlayersStore from './PlayersStore.svelte'
import SoundManager from './SoundManager.svelte'
import { createMyUserStore } from './MyUserStore.svelte'

export class AppManager {
	readonly myUserStore = createMyUserStore()
	readonly playersStore = new PlayersStore()
	readonly playersMovesStore = new PlayersMovesStore()
	readonly soundManager = new SoundManager()

	constructor() {
		this.soundManager.preloadSounds(SOUNDS)
	}
}

export default AppManager

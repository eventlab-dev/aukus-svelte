import { SOUNDS } from '$lib/constants'
import PlayersMovesStore from './PlayersMovesStore.svelte'
import PlayersStore from './PlayersStore.svelte'
import SoundManager from './SoundManager.svelte'
import { createUsersStore } from './UsersStore.svelte'

export class AppManager {
	readonly usersStore = createUsersStore()
	readonly playersStore = new PlayersStore()
	readonly playersMovesStore = new PlayersMovesStore()
	readonly soundManager = new SoundManager()

	constructor() {
		this.soundManager.preloadSounds(SOUNDS)
	}
}

export default AppManager

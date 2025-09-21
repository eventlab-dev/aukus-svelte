import { SOUNDS } from '$lib/constants'
import PlayersMovesStore from './PlayersMovesStore.svelte'
import PlayersStore from './PlayersStore.svelte'
import SoundManager from './SoundManager.svelte'
import UsersStore from './UsersStore.svelte'

export class AppManager {
	readonly usersStore = new UsersStore()
	readonly playersStore = new PlayersStore()
	readonly playersMovesStore = new PlayersMovesStore()
	readonly soundManager = new SoundManager()

	readonly myUser = $derived(this.usersStore.myUser)

	constructor() {
		this.soundManager.preloadSounds(SOUNDS)
	}
}

export default AppManager

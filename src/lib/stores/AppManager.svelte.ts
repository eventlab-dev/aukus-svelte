import { SOUNDS } from '$lib/constants'
import { createGamesHistoryStore } from './GamesHistoryStore.svelte'
import PlayersMovesStore from './PlayersMovesStore.svelte'
import PlayersStore from './PlayersStore.svelte'
import SoundManager from './SoundManager.svelte'
import { createUsersStore } from './UsersStore.svelte'

export class AppManager {
	readonly usersStore = createUsersStore()
	readonly gamesHistoryStore = createGamesHistoryStore()
	readonly playersStore = new PlayersStore()
	readonly playersMovesStore = new PlayersMovesStore()
	readonly soundManager = new SoundManager()

	constructor() {
		this.soundManager.preloadSounds(SOUNDS)
	}
}

export default AppManager

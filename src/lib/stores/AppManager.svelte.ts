import { SOUNDS } from '$lib/constants'
import { QueryClient } from '@tanstack/svelte-query'
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

	readonly queryClient = new QueryClient()

	constructor() {
		this.soundManager.preloadSounds(SOUNDS)
	}
}

export default AppManager

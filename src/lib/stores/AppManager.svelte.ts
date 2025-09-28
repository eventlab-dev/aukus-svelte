import { SOUNDS } from '$lib/constants'
import { derived, type Readable } from 'svelte/store'
import { createEventDataStore } from './EventDataStore.svelte'
import { createGamesHistoryStore } from './GamesHistoryStore.svelte'
import { createPlayerMovesStore } from './PlayersMovesStore.svelte'
import SoundManager from './SoundManager.svelte'
import { createUsersStore } from './UsersStore.svelte'
import type { PlayerData } from '$lib/types'

export function createAppManager() {
	const usersStore = createUsersStore()
	const gamesHistoryStore = createGamesHistoryStore()
	const eventDataStore = createEventDataStore()
	const playersMovesStore = createPlayerMovesStore()

	const soundManager = new SoundManager()
	soundManager.preloadSounds(SOUNDS)

	const { users } = usersStore
	const { players: playersData } = eventDataStore

	const players: Readable<PlayerData[]> = derived([users, playersData], ([$users, $players]) => {
		const list: PlayerData[] = []
		for (const player of $players) {
			const slug = player.slug
			const user = $users.find((u) => u.slug === slug)
			if (!user) continue
			list.push({
				...user,
				...player,
				total_score: 0
			})
		}
		return list
	})

	const playersBySlug = derived(players, ($players) => {
		const map: Record<string, (typeof $players)[0]> = {}
		$players.forEach((player) => {
			map[player.slug] = player
		})
		return map
	})

	const myUser = usersStore.myUser

	const myPlayer = derived([players, myUser], ([$players, $myUser]) => {
		if (!$myUser) return null
		return $players.find((p) => p.slug === $myUser.slug) || null
	})

	return {
		usersStore,
		gamesHistoryStore,
		eventDataStore,
		playersMovesStore,
		soundManager,
		players,
		playersBySlug,
		myPlayer
	}
}

export type AppManager = ReturnType<typeof createAppManager>

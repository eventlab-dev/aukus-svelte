import { SOUNDS } from '$lib/constants'
import { derived, writable, type Readable } from 'svelte/store'
import { createEventDataStore } from './EventDataStore.svelte'
import { createGamesHistoryStore } from './GamesHistoryStore.svelte'
import { createPlayerMovesStore } from './PlayersMovesStore.svelte'
import SoundManager from './SoundManager.svelte'
import { createUsersStore } from './UsersStore.svelte'
import { type PlayerData, type TurnState } from '$lib/types'
import { createMovementStore } from './MovementStore.svelte'
import { createStatsStore } from './StatsStore.svelte'

export function createAppManager() {
	const usersStore = createUsersStore()
	const gamesHistoryStore = createGamesHistoryStore()
	const eventDataStore = createEventDataStore()
	const playersMovesStore = createPlayerMovesStore()
	const statsStore = createStatsStore()

	const frontendState = writable<TurnState>(null)

	const movementStore = createMovementStore({ eventDataStore, frontendTurnState: frontendState })

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

	const backendState: Readable<TurnState> = derived(eventDataStore.myLastMove, ($myLastMove) => {
		if ($myLastMove) {
			if (!$myLastMove.dice_roll_id && $myLastMove.type !== 'reroll') {
				return 'selecting-dice'
			}
			return 'filling-form'
		}
		return null
	})

	const turnState = derived([backendState, frontendState], ([$backendState, $frontendState]) => {
		return $frontendState || $backendState
	})

	return {
		usersStore,
		gamesHistoryStore,
		eventDataStore,
		playersMovesStore,
		soundManager,
		players,
		playersBySlug,
		myPlayer,
		movementStore,
		turnState,
		frontendState,
		statsStore
	}
}

export type AppManager = ReturnType<typeof createAppManager>

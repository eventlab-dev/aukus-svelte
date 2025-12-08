import { LastMapPosition, SOUNDS } from '$lib/constants'
import { derived, readable, writable, type Readable } from 'svelte/store'
import { createEventDataStore } from './EventDataStore.svelte'
import { createGamesHistoryStore } from './GamesHistoryStore.svelte'
import { createPlayerMovesStore } from './PlayersMovesStore.svelte'
import SoundManager from './SoundManager.svelte'
import { createUsersStore } from './UsersStore.svelte'
import { type PlayerData, type TurnState } from '$lib/types'
import { createMovementStore } from './MovementStore.svelte'
import { createStatsStore } from './StatsStore.svelte'
import { createNotificationStore } from './NotificationStore.svelte'
import { getPlayerScore } from '$lib/utils'
import { createCanvasStore } from './CanvasStore.svelte'
import { createGamesMatchesStore } from './GamesMatchesStore.svelte'
import { createErrorNotificationStore } from './ErrorNotificationStore.svelte'
import { createShitStore } from './ShitStore.svelte'
import { createGameTimeStore } from './gameTimeStore'

export function createAppManager() {
	const usersStore = createUsersStore()
	const eventDataStore = createEventDataStore()
	const playersMovesStore = createPlayerMovesStore({})
	const statsStore = createStatsStore()
	const gamesHistoryStore = createGamesHistoryStore({ eventDataStore })
	const gamesMatchesStore = createGamesMatchesStore({ eventDataStore })

	const frontendState = writable<TurnState>(null)

	const { users, myUser } = usersStore

	const movementStore = createMovementStore({
		eventDataStore,
		frontendTurnState: frontendState,
		usersStore
	})

	const notificationStore = createNotificationStore({ eventDataStore })
	const canvasStore = createCanvasStore()
	const errorNotificationStore = createErrorNotificationStore()
	const shitStore = createShitStore()

	const soundManager = new SoundManager()

	myUser.subscribe((user) => {
		if (user) {
			soundManager.preloadSounds(SOUNDS)
		}
	})

	const { players: playersData } = eventDataStore
	const { statsBySlug } = statsStore

	const players: Readable<PlayerData[]> = derived(
		[users, playersData, statsBySlug],
		([$users, $players, $statsBySlug]) => {
			const list: PlayerData[] = []
			for (const player of $players) {
				const slug = player.slug
				const user = $users.find((u) => u.slug === slug)
				const stats = $statsBySlug[slug]
				if (!user || !stats) {
					console.warn('Missing data for player:', slug, user, stats)
					continue
				}
				list.push({
					...user,
					...player,
					total_score: getPlayerScore(stats)
				})
			}
			return list
		}
	)

	const playersBySlug = derived(players, ($players) => {
		const map: Record<string, (typeof $players)[0]> = {}
		$players.forEach((player) => {
			map[player.slug] = player
		})
		return map
	})

	const myPlayer = derived([players, myUser], ([$players, $myUser]) => {
		if (!$myUser) return null
		return $players.find((p) => p.slug === $myUser.slug) || null
	})

	const backendState: Readable<TurnState> = derived(myPlayer, ($myPlayer) => {
		if ($myPlayer) {
			if ($myPlayer.last_move) {
				if ($myPlayer.last_move.type === 'completed' && $myPlayer.map_position === 102) {
					return 'event-completed'
				}
				if (!$myPlayer.last_move.dice_roll_id && $myPlayer.last_move.type !== 'reroll') {
					return 'selecting-dice'
				}
			}
			return 'filling-form'
		}
		return null
	})

	const turnState = derived([backendState, frontendState], ([$backendState, $frontendState]) => {
		if ($frontendState === 'form-sent') {
			if ($backendState === 'event-completed') {
				return 'player-win-animation'
			}
			return $backendState
		}
		return $frontendState || $backendState
	})

	const playersCompletedMap = derived(players, ($players) => {
		return $players
			.filter((p) => p.map_position === 102)
			.toSorted((a, b) => a.last_move!.created_at - b.last_move!.created_at)
	})

	const playersInOrder = derived(
		[players, playersCompletedMap],
		([$players, $playersCompletedMap]) => {
			const playersNotCompletedMap = $players.filter((p) => p.map_position <= LastMapPosition)
			playersNotCompletedMap.sort((a, b) => {
				if (a.total_score === b.total_score) {
					return b.map_position - a.map_position
				}
				return b.total_score - a.total_score
			})
			return [...$playersCompletedMap, ...playersNotCompletedMap]
		}
	)

	const eventNotStarted = derived(eventDataStore.eventSettings, ($settings) => {
		if ($settings?.event_start_time) {
			return Number($settings?.event_start_time) * 1000 > Date.now()
		}
		return false
	})

	const eventFinished = derived(
		[eventDataStore.eventSettings, playersCompletedMap],
		([$settings, $playersCompletedMap]) => {
			if ($playersCompletedMap.length > 0) {
				return true
			}
			if ($settings?.event_end_time) {
				return Number($settings?.event_end_time) * 1000 < Date.now()
			}
			return false
		}
	)

	const eventActive = derived([eventNotStarted, eventFinished], ([$notStarted, $finished]) => {
		return !$notStarted && !$finished
	})

	const winners = derived(
		[playersInOrder, playersCompletedMap, eventFinished],
		([$players, $playersCompletedMap, $eventFinished]) => {
			if ($eventFinished) {
				return $players.length > 3 ? $players.slice(0, 3) : $players
			}
			return $playersCompletedMap
		}
	)

	const isMobile = readable(false, (set) => {
		const query = window.matchMedia('(max-width: 768px)')
		set(query.matches)

		const listener = (e: MediaQueryListEvent) => set(e.matches)
		query.addEventListener('change', listener)

		return () => query.removeEventListener('change', listener)
	})

	const gameTimeStore = createGameTimeStore({ usersStore })

	return {
		usersStore,
		gamesHistoryStore,
		eventDataStore,
		playersMovesStore,
		soundManager,
		notificationStore,
		errorNotificationStore,
		players,
		playersBySlug,
		myPlayer,
		movementStore,
		turnState,
		frontendState,
		statsStore,
		winners,
		eventFinished,
		eventNotStarted,
		eventActive,
		playersInOrder,
		playersCompletedMap,
		canvasStore,
		gamesMatchesStore,
		isMobile,
		shitStore,
		gameTimeStore
	}
}

export type AppManager = ReturnType<typeof createAppManager>

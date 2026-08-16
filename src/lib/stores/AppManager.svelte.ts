import { SOUNDS, WinPosition } from '$lib/constants'
import { createContext, untrack } from 'svelte'
import { EventDataStore } from './EventDataStore.svelte'
import { GameHistoryStore } from './GamesHistoryStore.svelte'
import { PlayerMovesStore } from './PlayersMovesStore.svelte'
import SoundManager from './SoundManager.svelte'
import { UsersStore } from './UsersStore.svelte'
import { type PlayerData, type TurnState } from '$lib/types'
import { MovementStore } from './MovementStore.svelte'
import { StatsStore } from './StatsStore.svelte'
import { NotificationStore } from './NotificationStore.svelte'
import { getPlayerScore } from '$lib/utils'
import { CanvasStore } from './CanvasStore.svelte'
import { GamesMatchesStore } from './GamesMatchesStore.svelte'
import { ErrorNotificationStore } from './ErrorNotificationStore.svelte'
import { ShitStore } from './ShitStore.svelte'
import { GameTimeStore } from './gameTimeStore.svelte'
import { SnowStore } from './SnowStore.svelte'
import { MapStore } from './MapStore.svelte'
import { NavStore } from './NavStore.svelte'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'
import { TimerStore } from './TimerStore.svelte'
import { TimeStore } from './TimeStore.svelte'
import { IntegrationsStore } from './IntegrationsStore.svelte'

export class AppManager {
	usersStore = new UsersStore()
	users = $derived(this.usersStore.users)
	myUser = $derived(this.usersStore.myUser)

	eventDataStore = new EventDataStore()
	statsStore = new StatsStore()

	mapStore = new MapStore()
	canvasStore = new CanvasStore()
	errorNotificationStore = new ErrorNotificationStore()
	shitStore = new ShitStore()
	integrationsStore = new IntegrationsStore({
		getPlayerSlug: () => this.myUser?.slug ?? null
	})

	timeStore = new TimeStore()
	snowStore = new SnowStore()
	navStore = new NavStore()

	playersSlugs = $derived(this.eventDataStore.players.map((p) => p.slug))

	timerStore = new TimerStore()

	playersMovesStore = new PlayerMovesStore()
	gamesHistoryStore = new GameHistoryStore({
		getPlayersSlugs: () => this.playersSlugs
	})
	gamesMatchesStore = new GamesMatchesStore({
		getPlayersSlugs: () => this.playersSlugs
	})
	movementStore = new MovementStore({
		getEventDataStore: () => this.eventDataStore,
		updateFrontendTurnState: (state) => {
			this.frontendState = state
		},
		getMapStore: () => this.mapStore,
		getPlayerSlug: () => this.myUser?.slug ?? null
	})

	notificationStore = new NotificationStore({
		getAchievementsById: () => this.eventDataStore.achievementsById
	})

	gameTimeStore = new GameTimeStore({
		getMyUserSlug: () => this.myUser?.slug ?? null
	})

	frontendState = $state<TurnState>(null)
	moveFormOpen = $state(false)
	soundManager = new SoundManager()

	constructor() {
		this.timerStore.start()
		$effect(() => {
			if (this.myUser) {
				untrack(() => this.soundManager.preloadSounds(SOUNDS))
			}
		})

		const query = window.matchMedia('(max-width: 768px)')
		this.isMobile = query.matches

		const listener = (e: MediaQueryListEvent) => {
			this.isMobile = e.matches
		}
		query.addEventListener('change', listener)
	}

	players = $derived.by(() => {
		const list: PlayerData[] = []
		for (const player of this.eventDataStore.players) {
			const slug = player.slug
			const user = this.usersStore.usersBySlug.get(slug)
			const stats = this.statsStore.statsBySlug.get(slug)
			// console.log({ slug, user, stats })
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
		list.sort((a, b) => a.username.localeCompare(b.username))
		return list
	})

	playersBySlug = $derived(new SvelteMap(this.players.map((player) => [player.slug, player])))

	myPlayer = $derived(this.players.find((p) => p.slug === this.myUser?.slug) || null)

	backendState = $derived.by(() => {
		if (this.myPlayer) {
			if (this.myPlayer.last_move) {
				if (
					this.myPlayer.last_move.type === 'completed' &&
					this.myPlayer.map_position === WinPosition
				) {
					return 'event-completed'
				}
				if (!this.myPlayer.last_move.dice_roll_id && this.myPlayer.last_move.type !== 'reroll') {
					return 'selecting-dice'
				}
			}
			return 'filling-form'
		}
		return null
	})

	turnState = $derived.by(() => {
		if (this.frontendState === 'form-sent') {
			if (this.backendState === 'event-completed') {
				return 'player-win-animation'
			}
			return this.backendState
		}
		return this.frontendState || this.backendState
	})

	playersCompletedMap = $derived(
		this.players
			.filter((p) => p.map_position === WinPosition && p.last_move)
			.toSorted((a, b) => a.last_move!.created_at - b.last_move!.created_at)
	)

	playersInOrder = $derived.by(() => {
		const completedSlugs = new SvelteSet(this.playersCompletedMap.map((p) => p.slug))
		const playersNotCompletedMap = this.players.filter((p) => !completedSlugs.has(p.slug))
		playersNotCompletedMap.sort((a, b) => {
			if (a.total_score === b.total_score) {
				return b.map_position - a.map_position
			}
			return b.total_score - a.total_score
		})
		return [...this.playersCompletedMap, ...playersNotCompletedMap]
	})

	eventNotStarted = $derived.by(() => {
		if (this.eventDataStore.eventSettings?.event_start_time) {
			return Number(this.eventDataStore.eventSettings.event_start_time) > this.timeStore.nowSeconds
		}
		return false
	})

	eventFinished = $derived.by(() => {
		if (this.playersCompletedMap.length > 0) {
			return true
		}
		if (this.eventDataStore.eventSettings?.event_end_time) {
			return Number(this.eventDataStore.eventSettings.event_end_time) <= this.timeStore.nowSeconds
		}
		return false
	})

	eventActive = $derived(!this.eventNotStarted && !this.eventFinished)

	winners = $derived.by(() => {
		if (this.eventFinished) {
			return this.playersInOrder.length > 3 ? this.playersInOrder.slice(0, 3) : this.playersInOrder
		}
		return this.playersCompletedMap
	})

	isMobile = $state(false)
}

export const [getAppManager, setAppManager] = createContext<AppManager>()

import { createTimeline } from 'animejs'
import {
	CellSize,
	getCellPosition,
	getMapCellById,
	getWinnerPosition,
	type MapCell
} from '$lib/mapUtils'
import { SvelteMap } from 'svelte/reactivity'
import { get, writable, type Writable } from 'svelte/store'
import type { EventDataStore } from './EventDataStore.svelte'
import { type PlayerData, type PlayerMovementState, type TurnState } from '$lib/types'
import { DICE_ROLL_ANIMATION_TIME, DICE_ROLL_IDLE_TIME, LastMapPosition } from '$lib/constants'
import type { FinishPlayerMoveResponse, PlayerItem } from '$lib/heyapi/aukus/types.gen'
import type { UsersStore } from './UsersStore.svelte'

export function createMovementStore({
	eventDataStore,
	frontendTurnState,
	usersStore
}: {
	eventDataStore: EventDataStore
	frontendTurnState: Writable<TurnState | null>
	usersStore: UsersStore
}) {
	const playerElements = writable(new SvelteMap<string, HTMLElement>())

	const myMovementState = writable<PlayerMovementState>({
		rollValues: [],
		startCell: 0,
		steps: 0,
		minSteps: 1
	})

	const registerPlayer = (playerId: string, element: HTMLElement) => {
		playerElements.update((map) => {
			map.set(playerId, element)
			return map
		})
	}

	function setPlayerItem(player: PlayerItem) {
		eventDataStore.players.update((curr) => {
			const idx = curr.findIndex((p) => p.slug === player.slug)
			if (idx !== -1) {
				curr[idx] = player
			}
			return [...curr]
		})
	}

	const offsetInsideCellX = 25
	const offsetInsideCellY = 15

	const moveToCell = async (params: {
		playerSlug: string
		steps: number
		moveResponse: FinishPlayerMoveResponse
		updatePlayerPosition?: boolean
	}) => {
		const element = get(playerElements).get(params.playerSlug)
		if (!element) return

		const player = get(eventDataStore.playersBySlug).get(params.playerSlug)
		if (!player) return

		const isMyPlayer = get(usersStore.myUser)?.slug === player.slug

		const startCell = player.map_position

		if (params.steps === 0) return

		const endCell = startCell + params.steps
		const direction = params.steps > 0 ? 1 : -1

		if (isMyPlayer) {
			frontendTurnState.set('player-map-animation')
			myMovementState.update((s) => ({
				...s,
				steps: params.steps,
				startCell
			}))
		}

		const cellsPath: MapCell[] = []
		for (let i = 1; i <= Math.abs(params.steps); i++) {
			cellsPath.push(getMapCellById(startCell + i * direction))
		}

		const timeline = createTimeline()
		if (startCell === 0) {
			// move to the start
			timeline.add(element, {
				left: `${getCellPosition(0).x + offsetInsideCellX}px`,
				top: `${getCellPosition(0).y + offsetInsideCellY}px`,
				duration: 700,
				easing: 'easeInOutQuad',
				// add "jump" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 350, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 350, easing: 'easeInQuad' }
				]
			})
		}

		cellsPath.forEach((cell) => {
			const pos = getCellPosition(cell.id)
			timeline.add(element, {
				left: `${pos.x + offsetInsideCellX}px`,
				top: `${pos.y + offsetInsideCellY}px`,
				duration: 700,
				easing: 'easeInOutQuad',
				// add "jump" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 350, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 350, easing: 'easeInQuad' }
				]
			})
		})

		let finalCell = endCell
		// const ladder = laddersByCell[endCell]
		if (params.moveResponse.ladder_to) {
			const pos = getCellPosition(params.moveResponse.ladder_to)
			timeline.add(element, {
				left: `${pos.x + offsetInsideCellX}px`,
				top: `${pos.y + offsetInsideCellY}px`,
				duration: 1500,
				easing: 'easeInOutQuad',
				// add "climb" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 750, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 750, easing: 'easeInQuad' }
				]
			})
			finalCell = params.moveResponse.ladder_to
		}
		// const snake = snakesByCell[endCell]
		if (params.moveResponse.snake_to) {
			const pos = getCellPosition(params.moveResponse.snake_to)
			timeline.add(element, {
				left: `${pos.x + offsetInsideCellX}px`,
				top: `${pos.y + offsetInsideCellY}px`,
				duration: 1500,
				easing: 'easeInOutQuad',
				keyframes: [
					// add "fall" effect
					{ translateY: 0, scale: 1.1, rotate: 90, duration: 900, easing: 'easeInBounce' },
					{ translateY: 0, scale: 1.1, rotate: 90, duration: 1000, easing: 'easeInBounce' },
					{ translateY: 0, scale: 1, rotate: 0, duration: 200, easing: 'easeOutBounce' }
				]
			})
			finalCell = params.moveResponse.snake_to
		}

		await new Promise((resolve) => {
			timeline.play().onComplete = () => {
				resolve(true)
			}
		})

		if (params.updatePlayerPosition) {
			eventDataStore.players.update((curr) => {
				const idx = curr.findIndex((p) => p.slug === params.playerSlug)
				if (idx !== -1) {
					curr[idx] = { ...curr[idx], map_position: finalCell }
				}
				return [...curr]
			})
		}

		return finalCell
	}

	async function moveToWinPosition(params: { playerSlug: string; position: number }) {
		const element = get(playerElements).get(params.playerSlug)
		if (!element) return

		const startPos = getCellPosition(LastMapPosition)
		const finalPos = getWinnerPosition(params.position)

		frontendTurnState.set('player-map-animation')

		const timeline = createTimeline()
		timeline.add(element, {
			top: `${startPos.y - CellSize + offsetInsideCellY}px`,
			left: `${startPos.x + offsetInsideCellX}px`,
			duration: 2000,
			easing: 'easeInOutQuad'
		})
		timeline.add(element, {
			top: `${startPos.y - CellSize + offsetInsideCellY}px`,
			left: `${finalPos.x}px`,
			duration: 4000,
			easing: 'easeInOutQuad',
			// add "jump" effect
			keyframes: [
				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' },

				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' },

				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' },

				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' }
			]
		})
		timeline.add(element, {
			left: `${finalPos.x}px`,
			top: `${finalPos.y}px`,
			duration: 2000,
			easing: 'easeInOutQuad'
			// add "jump" effect
			// keyframes: [
			// 	{ translateY: -50, scale: 0.85, duration: 350, easing: 'easeOutQuad' },
			// 	{ translateY: 0, scale: 1, duration: 350, easing: 'easeInQuad' }
			// ]
		})

		await new Promise((resolve) => {
			timeline.play().onComplete = () => {
				resolve(true)
			}
		})
	}

	async function doRollAnimation(rollValues: number[], steps: number) {
		if (rollValues.length === 0) {
			throw new Error('rollValues cannot be empty')
		}
		myMovementState.update((s) => ({ ...s, rollValues }))
		frontendTurnState.set('dice-animation')
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_ANIMATION_TIME))
		frontendTurnState.set('dice-results')
		myMovementState.update((s) => ({ ...s, steps }))
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_IDLE_TIME))
	}

	const selectedPlayer = writable<PlayerData | null>(null)
	const hoveredPlayer = writable<string | null>(null)

	eventDataStore.updatedPlayers.subscribe(($players) => {
		const previous = get(eventDataStore.players)
		// console.log('previous players', previous)
		if (previous.length === 0) {
			eventDataStore.players.set($players)
			return
		}

		// animate only players that moved
		$players.forEach((player) => {
			const last_move = player.last_move
			const previousPlayer = previous.find((p) => p.slug === player.slug)
			const element = get(playerElements).get(player.slug)

			if (
				!element ||
				!previousPlayer ||
				!last_move ||
				previousPlayer.map_position === player.map_position ||
				player.map_position > LastMapPosition
			) {
				setPlayerItem(player)
				return
			}

			// console.log('animating player', player)

			const cellPosition = getCellPosition(previousPlayer.map_position)
			element.style.top = `${cellPosition.y + offsetInsideCellY}px`
			element.style.left = `${cellPosition.x + offsetInsideCellX}px`

			const finalCell = last_move.ladder_from ?? last_move.snake_from ?? last_move.cell_to
			const steps = finalCell - previousPlayer.map_position

			moveToCell({
				playerSlug: player.slug,
				moveResponse: {
					unlocked_achievements: [],
					move_to: finalCell,
					ladder_to: last_move.ladder_to,
					snake_to: last_move.snake_to
				},
				steps
			}).then(() => {
				setPlayerItem(player)
			})
		})
	})

	return {
		registerPlayer,
		moveToCell,
		moveToWinPosition,
		myMovementState,
		doRollAnimation,
		selectedPlayer,
		hoveredPlayer
	}
}

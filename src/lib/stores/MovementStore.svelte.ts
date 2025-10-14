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
import { DICE_ROLL_ANIMATION_TIME, DICE_ROLL_IDLE_TIME } from '$lib/constants'
import type { FinishPlayerMoveResponse } from '$lib/heyapi/aukus/types.gen'

export function createMovementStore({
	eventDataStore,
	frontendTurnState
}: {
	eventDataStore: EventDataStore
	frontendTurnState: Writable<TurnState | null>
}) {
	const playerElements = writable(new SvelteMap<string, HTMLElement>())

	const movementState = writable<PlayerMovementState>({
		rollValues: [],
		startCell: 0,
		steps: 0
	})

	const registerPlayer = (playerId: string, element: HTMLElement) => {
		playerElements.update((map) => {
			map.set(playerId, element)
			return map
		})
	}

	const offsetInsideCellX = 25
	const offsetInsideCellY = 15

	const moveToCell = async (params: {
		playerSlug: string
		steps: number
		moveResponse: FinishPlayerMoveResponse
	}) => {
		const element = get(playerElements).get(params.playerSlug)
		if (!element) return

		const player = get(eventDataStore.playersBySlug).get(params.playerSlug)
		if (!player) return

		const startCell = player.map_position

		if (params.steps === 0) return

		const endCell = startCell + params.steps
		const direction = params.steps > 0 ? 1 : -1

		frontendTurnState.set('player-map-animation')

		movementState.update((s) => ({
			...s,
			steps: params.steps,
			startCell
		}))

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
					{ translateY: 0, scale: 1.1, rotate: 90, duration: 5000, easing: 'easeInBounce' },
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
		return finalCell
	}

	async function moveToWinPosition(params: { playerSlug: string; position: number }) {
		const element = get(playerElements).get(params.playerSlug)
		if (!element) return

		const startPos = getCellPosition(101)
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
		movementState.update((s) => ({ ...s, rollValues }))
		frontendTurnState.set('dice-animation')
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_ANIMATION_TIME))
		frontendTurnState.set('dice-results')
		movementState.update((s) => ({ ...s, steps }))
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_IDLE_TIME))
	}

	const selectedPlayer = writable<PlayerData | null>(null)

	return {
		registerPlayer,
		moveToCell,
		moveToWinPosition,
		movementState,
		doRollAnimation,
		selectedPlayer
	}
}

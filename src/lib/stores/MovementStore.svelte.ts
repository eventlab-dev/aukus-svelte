import { createTimeline } from 'animejs'
import {
	getCellPosition,
	getMapCellById,
	laddersByCell,
	snakesByCell,
	type MapCell
} from '$lib/mapUtils'
import { SvelteMap } from 'svelte/reactivity'
import { get, writable } from 'svelte/store'
import type { EventDataStore } from './EventDataStore.svelte'
import { type PlayerData, type PlayerMovementState } from '$lib/types'
import { DICE_ROLL_ANIMATION_TIME, DICE_ROLL_IDLE_TIME } from '$lib/constants'

export function createMovementStore({ eventDataStore }: { eventDataStore: EventDataStore }) {
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

	const movePlayer = async (params: { playerSlug: string; steps: number }) => {
		const element = get(playerElements).get(params.playerSlug)
		if (!element) return

		const player = get(eventDataStore.playersBySlug).get(params.playerSlug)
		if (!player) return

		const startCell = player.map_position

		if (params.steps === 0) return
		if (startCell <= 1 && params.steps < 0) return

		let endCell = startCell + params.steps
		let boundSteps = params.steps

		if (endCell < 0) {
			endCell = 0
			boundSteps = -startCell
		}

		const direction = params.steps > 0 ? 1 : -1

		movementState.update((s) => ({
			...s,
			state: 'moving',
			steps: boundSteps,
			direction: direction === 1 ? 'forward' : 'backward',
			startCell
		}))

		const cellsPath: MapCell[] = []
		for (let i = 1; i <= Math.abs(boundSteps); i++) {
			cellsPath.push(getMapCellById(startCell + i * direction))
		}

		const offsetInsideCellX = 25
		const offsetInsideCellY = 15

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
		const ladder = laddersByCell[endCell]
		if (ladder) {
			const pos = getCellPosition(ladder.cellTo)
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
			finalCell = ladder.cellTo
		}
		const snake = snakesByCell[endCell]
		if (snake) {
			const pos = getCellPosition(snake.cellTo)
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
			finalCell = snake.cellTo
		}

		await new Promise((resolve) => {
			timeline.play().onComplete = () => {
				resolve(true)
			}
		})
		movementState.update((s) => ({ ...s, state: 'finished' }))
		return finalCell
	}

	async function doRollAnimation(rollValues: number[]) {
		if (rollValues.length === 0) {
			throw new Error('rollValues cannot be empty')
		}
		movementState.update((s) => ({ ...s, rollValues, state: 'rolling-dice' }))
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_ANIMATION_TIME))
		movementState.update((s) => ({ ...s, state: 'dice-results' }))
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_IDLE_TIME))
	}

	const selectedPlayer = writable<PlayerData | null>(null)

	return {
		registerPlayer,
		movePlayer,
		movementState,
		doRollAnimation,
		selectedPlayer
	}
}
